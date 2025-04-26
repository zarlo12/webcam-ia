import React, { useRef, useEffect } from "react";

// Importa o define las rutas de tus imágenes de marco
//import claroMedia from "../../assets/img/ClaroMedia.png";

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

    // Función para cargar una imagen y retornar una promesa
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Útil si las imágenes provienen de otro dominio
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
      });

    // Cargamos la imagen avatar y las imágenes de marco
    Promise.all([
      loadImage(imageUrl),
      loadImage(logoderecha),
      loadImage(logoabajo),
    ])
      .then(([avatar, LogoUno, LogoDos]) => {
        // Definir dimensiones del canvas en base al avatar (puedes ajustar según necesidad)
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibuja la imagen principal (avatar)
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        const scaleFactorIzq = 0.2; // Factor de escala (0.5 = 50% más pequeño)
        const scaleFactorDer = 0.4;

        ctx.drawImage(
          LogoUno,
          canvas.width - LogoUno.width * scaleFactorDer + 10,
          20,
          LogoUno.width * scaleFactorDer,
          LogoUno.height * scaleFactorDer
        );

        ctx.drawImage(
          LogoDos,
          20,
          40,
          LogoDos.width * scaleFactorIzq,
          LogoDos.height * scaleFactorIzq
        );

        // Convierte el canvas a data URL (imagen en formato PNG)
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar las imágenes:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio]);

  // El canvas se oculta ya que solo lo usamos para generar la imagen final
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
