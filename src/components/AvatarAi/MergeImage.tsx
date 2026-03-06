import React, { useRef, useEffect } from "react";

interface MergeImageProps {
  imageUrl: string; // URL de la imagen principal (avatar)
  onMerged: (mergedDataUrl: string) => void; // Callback para retornar la imagen fusionada
  tipoSuenio: string;
  selectedStyle?: string; // Estilo seleccionado (realista o caricatura)
}

const MergeImage: React.FC<MergeImageProps> = ({
  imageUrl,
  onMerged,
  tipoSuenio,
  selectedStyle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Carga de imagen con promesa
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
      });

    loadImage(imageUrl)
      .then((avatar) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Convertir a Data URL y pasar al callback
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar la imagen:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio, selectedStyle]);

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
