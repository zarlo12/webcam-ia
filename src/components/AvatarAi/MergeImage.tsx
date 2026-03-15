import React, { useRef, useEffect } from "react";
import fondo from '../../assets/img/logo_final.png'

interface MergeImageProps {
  imageUrl: string; // URL de la imagen principal (avatar)
  onMerged: (mergedDataUrl: string) => void; // Callback para retornar la imagen fusionada
  tipoSuenio: string;
}

const MergeImage: React.FC<MergeImageProps> = ({
  imageUrl,
  onMerged,
  tipoSuenio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Carga de imágenes con promesas
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
      });

    console.log(`🎨 Fusionando imagen empresarial con overlay inferior derecho`);

    Promise.all([
      loadImage(imageUrl),   // imagen principal (avatar empresarial)
      loadImage(fondo)       // elemento que va encima (superior izquierda)
    ])
      .then(([mainImg, overlayImg]) => {
        // Ajustamos el canvas al tamaño de la imagen principal (tamaño real)
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;

        // Dibujar la imagen principal como base (tamaño completo)
        ctx.drawImage(mainImg, 0, 0, canvas.width, canvas.height);

        // Dibujar el elemento overlay con posición y tamaño ajustables
        const overlayScale = 0.7; // Hacer el overlay 70% de su tamaño original
        const overlayWidth = overlayImg.width * overlayScale;
        const overlayHeight = overlayImg.height * overlayScale;
        
        // 🎯 POSICIÓN MANUAL - Ajusta estos valores para mover el overlay
        const overlayX = 450; // Posición X (horizontal) - aumenta para mover a la derecha
        const overlayY = 1180; // Posición Y (vertical) - aumenta para mover hacia abajo
        
        console.log(`🔍 Debug posicionamiento:`);
        console.log(`Canvas: ${canvas.width}x${canvas.height}`);
        console.log(`Overlay original: ${overlayImg.width}x${overlayImg.height}`);
        console.log(`Overlay escalado: ${overlayWidth}x${overlayHeight}`);
        console.log(`Posición manual: (${overlayX}, ${overlayY})`);
        
        // Dibujar el overlay con el nuevo tamaño y posición
        ctx.drawImage(
          overlayImg,
          overlayX,
          overlayY,
          overlayWidth,
          overlayHeight
        );

        console.log(`🎯 Imagen base: ${mainImg.width}x${mainImg.height}`);
        console.log(`🎯 Overlay posicionado en: (${overlayX}, ${overlayY}) - Tamaño: ${Math.round(overlayWidth)}x${Math.round(overlayHeight)}`);

        // Convertir a Data URL y pasar al callback
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar las imágenes:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio]);

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
