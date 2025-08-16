import React, { useRef, useEffect } from "react";
// import logoSuperior from "../../assets/img/LogoSuperior.png";
// import logoInferior from "../../assets/img/LogoInferior.png";
import referencias02 from '../../assets/colgate/Referencias-02.png'
import referencias03 from '../../assets/colgate/Referencias-03.png'
import referencias04 from '../../assets/colgate/Referencias-04.png'
import referencias05 from '../../assets/colgate/Referencias-05.png'
import logoSuperior from '../../assets/colgate/Logo.png'
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
  const referencias = [
    referencias02,
    referencias03,
    referencias04,
    referencias05
  ];

  // 🎯 CONSTANTES PARA AJUSTAR LA POSICIÓN Y TAMAÑO DE LA REFERENCIA
  const REFERENCIA_SCALE = 0.4;        // 30% del tamaño original
  const MARGIN_RIGHT = -50;             // Margen desde el borde derecho (más grande = más a la izquierda)
  const MARGIN_TOP = 0;               // Margen desde el borde superior
  const HORIZONTAL_OFFSET = 130;         // Offset adicional horizontal (negativo = más izquierda)
  const VERTICAL_OFFSET = 0;           // Offset adicional vertical (positivo = más abajo)

  // 🎯 CONSTANTES PARA EL LOGO SUPERIOR
  const LOGO_SCALE = 0.5;             // Tamaño del logo (15% del ancho del canvas)
  const LOGO_MARGIN_TOP = -40;          // Margen desde el borde superior

  // Función para obtener el índice actual desde localStorage
  const getCurrentIndex = () => {
    const saved = localStorage.getItem('referenciaIndex');
    return saved ? parseInt(saved, 10) : 0;
  };

  // Función para guardar el siguiente índice en localStorage
  const saveNextIndex = (currentIndex: number) => {
    const nextIndex = (currentIndex + 1) % referencias.length;
    localStorage.setItem('referenciaIndex', nextIndex.toString());
    return nextIndex;
  };

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

    // Usar el contador persistente desde localStorage
    const autoIndex = getCurrentIndex();
    const referenciaActual = referencias[autoIndex];

    console.log(`🔄 Auto-seleccionando referencia ${autoIndex + 1}/4: Referencias-0${autoIndex + 2} (desde localStorage)`);

    Promise.all([
      loadImage(imageUrl),    // avatar
      loadImage(referenciaActual), // referencia seleccionada automáticamente
      loadImage(logoSuperior) // logo superior
    ])
      .then(([avatar, referencia, logo]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Calcular tamaño y posición para la referencia usando constantes configurables
        const referenciaWidth = referencia.width * REFERENCIA_SCALE;
        const referenciaHeight = referencia.height * REFERENCIA_SCALE;

        // Posición: calculada con las constantes configurables
        const posX = canvas.width - referenciaWidth - MARGIN_RIGHT + HORIZONTAL_OFFSET;
        const posY = MARGIN_TOP + VERTICAL_OFFSET;

        // Dibujar la referencia en la posición calculada
        ctx.drawImage(
          referencia,
          posX,
          posY,
          referenciaWidth,
          referenciaHeight
        );

        // 🏷️ DIBUJAR EL LOGO SUPERIOR EN EL CENTRO
        const logoWidth = canvas.width * LOGO_SCALE;
        const logoHeight = (logo.height / logo.width) * logoWidth; // Mantener proporción
        const logoX = (canvas.width - logoWidth) / 2; // Centrado horizontalmente
        const logoY = LOGO_MARGIN_TOP; // Margen desde arriba

        ctx.drawImage(
          logo,
          logoX,
          logoY,
          logoWidth,
          logoHeight
        );

        console.log(`🖼️ Referencia aplicada automáticamente: ${autoIndex + 1}/4 - Posición: (${Math.round(posX)}, ${Math.round(posY)}) - Tamaño: ${Math.round(referenciaWidth)}x${Math.round(referenciaHeight)}`);
        console.log(`🏷️ Logo superior añadido: Posición: (${Math.round(logoX)}, ${Math.round(logoY)}) - Tamaño: ${Math.round(logoWidth)}x${Math.round(logoHeight)}`);

        // Guardar el siguiente índice para la próxima vez (cola automática persistente)
        const nextIndex = saveNextIndex(autoIndex);
        console.log(`💾 Próxima referencia será: ${nextIndex + 1}/4 (Referencias-0${nextIndex + 2})`);

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
