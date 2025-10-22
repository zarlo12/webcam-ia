import React, { useRef, useEffect } from "react";
// import logoSuperior from "../../assets/img/LogoSuperior.png";

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


    console.log(`🎨 Usando logo para estilo: ${selectedStyle || "caricatura"}`);

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
      //loadImage(logoToUse)    // Logo seleccionado dinámicamente
    ])
      .then(([avatar, ]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Logo Inferior: posición según el estilo
        // const infWidth = LogoInf.width * config.scale;
        // const infHeight = LogoInf.height * config.scale;
        
        // Calcular posición con configuración personalizada
     
        // Convertir a Data URL y pasar al callback
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar las imágenes:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio, selectedStyle]); // Agregamos selectedStyle a las dependencias

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
