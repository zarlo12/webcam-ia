import React, { useRef, useEffect } from "react";

import logoInferior from "../../assets/img/LogoInferior.png";

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

    Promise.all([
      loadImage(imageUrl),    // avatar
      loadImage(logoInferior) // Logo inferior centrado
    ])
      .then(([avatar, LogoInf]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Factor de escala y margen para el logo inferior
        const scale = 1.0;
        const margin = 12;

        const logoWidth = LogoInf.width * scale;
        const logoHeight = LogoInf.height * scale;

        // Dibujar LogoInferior centrado horizontalmente en la parte inferior
        ctx.drawImage(
          LogoInf,
          (canvas.width - logoWidth) / 2,
          canvas.height - logoHeight - margin,
          logoWidth,
          logoHeight
        );

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
