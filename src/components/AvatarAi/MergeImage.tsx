import React, { useRef, useEffect } from "react";
// import logoSuperior from "../../assets/img/LogoSuperior.png";
import logoInferior from "../../assets/xnova/Logos.png";

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
      //loadImage(logoSuperior),
      loadImage(logoInferior) // Logo inferior centrado
    ])
      .then(([avatar, LogoInf]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Factor de escala y margen para el logo inferior
        const scale = 1.1;
        const margin = 0;

        //const extraTopOffset =  margin*3; // distancia adicional para el logo superior
        const extraBottomOffset = margin ; // hacer que el logo inferior esté un poco más arriba

         //const supWidth = LogoSup.width * scale;
        //const supHeight = LogoSup.height * scale;

        // ctx.drawImage(
        //   LogoSup,
        //   (canvas.width - supWidth) / 2,
        //   extraTopOffset,
        //   supWidth,
        //   supHeight
        // );

        // Logo Inferior: centrado horizontalmente, un poco más arriba que antes
        const infWidth = LogoInf.width * scale;
        const infHeight = LogoInf.height * scale;
        ctx.drawImage(
          LogoInf,
          (canvas.width - infWidth) / 2,
          canvas.height - infHeight - extraBottomOffset,
          infWidth,
          infHeight
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
