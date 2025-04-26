import React, { useRef, useEffect } from "react";

import logoderecha from "../../assets/img/logo_derecha2.png";
import logoabajo from "../../assets/img/logo_derecha.png";

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
      loadImage(imageUrl), // avatar
      loadImage(logoderecha), // LogoUno
      loadImage(logoabajo), // LogoDos
    ])
      .then(([avatar, LogoUno, LogoDos]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Factores de escala para los logos
        const scaleUno = 0.4; // LogoUno (esquina inferior derecha)
        const scaleDos = 0.6; // LogoDos (centro derecha)
        const margin = 12; // espacio al borde

        // Dimensiones escaladas
        const uWidth = LogoUno.width * scaleUno;
        const uHeight = LogoUno.height * scaleUno;
        const dWidth = LogoDos.width * scaleDos;
        const dHeight = LogoDos.height * scaleDos;

        // LogoUno: esquina inferior derecha
        ctx.drawImage(
          LogoUno,
          canvas.width - uWidth - margin,
          canvas.height - uHeight - margin,
          uWidth,
          uHeight
        );

        // LogoDos: centrado verticalmente en el borde derecho
        // LogoDos: abajo centrado
        ctx.drawImage(
          LogoDos,
          (canvas.width - dWidth) / 2,
          canvas.height - dHeight - margin,
          dWidth,
          dHeight
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
