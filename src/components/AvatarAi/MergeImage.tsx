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
        const overlayScale = 0.3; // Hacer el overlay 40% de su tamaño original
        const overlayWidth = overlayImg.width * overlayScale;
        const overlayHeight = overlayImg.height * overlayScale;
        
        // 🎯 POSICIÓN MANUAL - Ajusta estos valores para mover el overlay
        const overlayX = 475; // Posición X (horizontal) - aumenta para mover a la derecha
        const overlayY = 1086; // Posición Y (vertical) - aumenta para mover hacia abajo
        
        console.log(`🔍 Debug posicionamiento:`);
        console.log(`Canvas: ${canvas.width}x${canvas.height}`);
        console.log(`Overlay original: ${overlayImg.width}x${overlayImg.height}`);
        console.log(`Overlay escalado: ${overlayWidth}x${overlayHeight}`);
        console.log(`Posición manual: (${overlayX}, ${overlayY})`);
        
        // 🎨 Crear marco circular tipo sticker para el logo
        const circleCenterX = overlayX + overlayWidth / 2;
        const circleCenterY = overlayY + overlayHeight / 2;
        // 🎯 TAMAÑO DEL CÍRCULO - Reduce este número para círculo más pequeño
        const circleRadius = 120; // Ajusta este valor (80 = pequeño, 120 = mediano, 150 = grande)
        
        // Guardar estado del canvas
        ctx.save();
        
        // Dibujar sombra del círculo (efecto de elevación)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        // Dibujar círculo blanco de fondo
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Dibujar borde del círculo para mayor definición
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Resetear sombra para el logo
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Crear clip circular para el logo
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, circleRadius - 10, 0, Math.PI * 2);
        ctx.clip();
        
        // Dibujar el overlay (logo) dentro del círculo
        ctx.drawImage(
          overlayImg,
          overlayX,
          overlayY,
          overlayWidth,
          overlayHeight
        );
        
        // Restaurar estado del canvas
        ctx.restore();

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
