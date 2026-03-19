import React, { useRef, useEffect } from "react";
// import fondo from '../../assets/img/TextIZQsup.png' // Logo desactivado

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

    console.log(`🎨 Procesando imagen sin overlay (logo desactivado)`);

    // Solo cargar y retornar la imagen principal sin overlay
    loadImage(imageUrl)
      .then((mainImg) => {
        // Ajustamos el canvas al tamaño de la imagen principal (tamaño real)
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;

        // Dibujar solo la imagen principal
        ctx.drawImage(mainImg, 0, 0, canvas.width, canvas.height);

        console.log(`🎯 Imagen procesada: ${mainImg.width}x${mainImg.height} (sin overlay)`);

        // Convertir a Data URL y pasar al callback
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar la imagen:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio]);

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
