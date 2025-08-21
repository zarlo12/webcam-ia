import React, { useRef, useEffect } from "react";
// import logoSuperior from "../../assets/img/LogoSuperior.png";
// import logoInferior from "../../assets/img/LogoInferior.png";
// import referencias02 from '../../assets/colgate/Referencias-02.png'
// import referencias03 from '../../assets/colgate/Referencias-03.png'
// import referencias04 from '../../assets/colgate/Referencias-04.png'
// import referencias05 from '../../assets/colgate/Referencias-05.png'
// import logoSuperior from '../../assets/clarosport/Logo.png'
interface MergeImageProps {
  imageUrl: string; // URL de la imagen principasl (avatar)
  onMerged: (mergedDataUrl: string) => void; // Callback para retornar la imagen fusionada
  tipoSuenio: string;
  referenciaIndex?: number; // Índice para seleccionar qué referencia usar (0-4)
}

const MergeImage: React.FC<MergeImageProps> = ({
  imageUrl,
  onMerged,
  tipoSuenio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Array de referencias en orden
 


  // Función para guardar el siguiente índice en localStorage


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

    ])
      .then(([avatar, ]) => {
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
        console.error("Error al cargar las imágenes:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio]); // Removí referenciaIndex de las dependencias

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
