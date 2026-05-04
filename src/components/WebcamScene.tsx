import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

// Interfaz para definir los métodos que el ref puede exponer
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

// Función auxiliar para recortar la imagen
const cropImage = (
  video: HTMLVideoElement,
  targetSize: number = 2048
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      reject(new Error("No se pudo obtener el contexto 2D"));
      return;
    }

    // Calculamos las dimensiones para el recorte cuadrado
    const videoAspect = video.videoWidth / video.videoHeight;
    let sourceWidth, sourceHeight, sourceX, sourceY;

    if (videoAspect > 1) {
      // Video más ancho que alto
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight;
      sourceX = (video.videoWidth - sourceHeight) / 2;
      sourceY = 0;
    } else {
      // Video más alto que ancho
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceWidth) / 2;
    }

    // Configuramos el canvas para el resultado final
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Dibujamos la porción recortada en el canvas
    ctx.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,  // área de origen
      0, 0, targetSize, targetSize                  // área de destino
    );

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar el blob de la imagen"));
      },
      "image/jpeg",
      0.98
    );
  });
};

// Tipamos el ref correctamente en forwardRef
const WebcamPlane = forwardRef<WebcamRef>((_, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement>(document.createElement("video"));
  const textureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const applyStream = (stream: MediaStream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      videoRef.current.onloadedmetadata = () => {
        if (!textureRef.current) return;
        const video = videoRef.current;
        const videoAspect = video.videoWidth / video.videoHeight;

        if (videoAspect > 1) {
          const scale = video.videoHeight / video.videoWidth;
          textureRef.current.repeat.set(scale, 1);
          textureRef.current.offset.set((1 - scale) / 2, 0);
        } else {
          const scale = video.videoWidth / video.videoHeight;
          textureRef.current.repeat.set(1, scale);
          textureRef.current.offset.set(0, (1 - scale) / 2);
        }

        textureRef.current.needsUpdate = true;
      };
    };

    // Intento 1: resolución alta ideal, sin mínimos obligatorios
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' } })
      .catch(() =>
        // Intento 2: sin restricción de facingMode (algunas webcams Windows no lo soportan)
        navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
      )
      .catch(() =>
        // Intento 3: cualquier cámara disponible
        navigator.mediaDevices.getUserMedia({ video: true })
      )
      .then(applyStream)
      .catch(err => console.error('No se pudo acceder a la cámara:', err));
  }, []);

  const texture = new THREE.VideoTexture(videoRef.current);
  textureRef.current = texture;

  useImperativeHandle(ref, () => ({
    captureImage: () => cropImage(videoRef.current),
  }));

  return (
    <mesh ref={meshRef} scale={[4.5, 4.5, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
});

// Tipamos el ref correctamente en WebcamScene
// Tipamos el ref correctamente en WebcamScene
const WebcamScene = forwardRef<WebcamRef>((_, ref) => {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 5], 
        fov: 55, // FOV más amplio para ver más área
        aspect: 1 // Forzar aspecto cuadrado 1:1
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.5} />
      <WebcamPlane ref={ref} />
    </Canvas>
  );
});

export default WebcamScene;
