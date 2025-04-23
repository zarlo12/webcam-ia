import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

// Interfaz para definir los métodos que el ref puede exponer
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

// Función auxiliar para recortar la imagen
const cropImage = (
  video: HTMLVideoElement,
  targetSize: number = 512
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
      0.95
    );
  });
};

// Tipamos el ref correctamente en forwardRef
const WebcamPlane = forwardRef<WebcamRef>((_, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement>(document.createElement("video"));

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(console.error);
  }, []);

  const texture = new THREE.VideoTexture(videoRef.current);

  useImperativeHandle(ref, () => ({
    captureImage: () => cropImage(videoRef.current),
  }));

  return (
    <mesh ref={meshRef} scale={[11, 6, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
});

// Tipamos el ref correctamente en WebcamScene
const WebcamScene = forwardRef<WebcamRef>((_, ref) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.5} />
      <WebcamPlane ref={ref} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
});

export default WebcamScene;
