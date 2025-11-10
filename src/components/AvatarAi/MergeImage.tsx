import React, { useRef, useEffect } from "react";
import fondo from '../../assets/claro/fondo1.jpg'
import logosimg from '../../assets/claro/logo.png'

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

  // 🎯 CONSTANTES PARA AJUSTAR LA POSICIÓN Y TAMAÑO DEL AVATAR
  const AVATAR_SCALE = 3;           // Tamaño del avatar (60% del tamaño original)
  const AVATAR_MARGIN_BOTTOM = -80;    // Margen desde el borde inferior
  const AVATAR_HORIZONTAL_CENTER = true; // Centrar horizontalmente

  // 🎯 CONSTANTES PARA AJUSTAR LA POSICIÓN Y TAMAÑO DEL LOGO
  const LOGO_SCALE = 0.1;             // Tamaño del logo
  const LOGO_X = 1450;                  // Posición X del logo
  const LOGO_Y = 250;                  // Posición Y del logo

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

    console.log(`🎨 Fusionando avatar con fondo de Electrolux + logo superior`);

    Promise.all([
      loadImage(fondo),      // fondo de Electrolux
      loadImage(imageUrl),   // avatar del usuario
      loadImage(logosimg)    // logo superior
    ])
      .then(([fondoImg, avatarImg, logoImg]) => {
        // Ajustamos el canvas al tamaño del fondo
        canvas.width = fondoImg.width;
        canvas.height = fondoImg.height;

        // Dibujar fondo completo
        ctx.drawImage(fondoImg, 0, 0, canvas.width, canvas.height);

        // Calcular tamaño y posición para el avatar
        const avatarWidth = avatarImg.width * AVATAR_SCALE;
        const avatarHeight = avatarImg.height * AVATAR_SCALE;

        // Posición: centrado horizontalmente y en la parte inferior
        const avatarX = AVATAR_HORIZONTAL_CENTER 
          ? (canvas.width - avatarWidth) / 2 
          : canvas.width - avatarWidth - 50; // fallback a la derecha
        const avatarY = canvas.height - avatarHeight - AVATAR_MARGIN_BOTTOM;

        // Dibujar el avatar en la posición calculada
        ctx.drawImage(
          avatarImg,
          avatarX,
          avatarY,
          avatarWidth,
          avatarHeight
        );

        console.log(`🎯 Avatar posicionado: (${Math.round(avatarX)}, ${Math.round(avatarY)}) - Tamaño: ${Math.round(avatarWidth)}x${Math.round(avatarHeight)}`);

        // 🎨 DIBUJAR EL LOGO COMO CAPA SUPERIOR
        const logoWidth = logoImg.width * LOGO_SCALE;
        const logoHeight = logoImg.height * LOGO_SCALE;

        // Posición simple del logo usando coordenadas directas
        const logoX = LOGO_X;
        const logoY = LOGO_Y;

        // Dibujar el logo como capa superior
        ctx.drawImage(
          logoImg,
          logoX,
          logoY,
          logoWidth,
          logoHeight
        );

        console.log(`🏷️ Logo posicionado: (${Math.round(logoX)}, ${Math.round(logoY)}) - Tamaño: ${Math.round(logoWidth)}x${Math.round(logoHeight)}`);

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
