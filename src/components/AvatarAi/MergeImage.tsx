import React, { useRef, useEffect } from "react";
// import logoSuperior from "../../assets/img/LogoSuperior.png";
import logoInferior from "../../assets/xnova/LogoXnova.png";
import logoInferior2 from "../../assets/xnova/LogoXnova2.png";

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

  // 🎯 CONSTANTES CONFIGURABLES PARA POSICIONAMIENTO DE LOGOS
  const LOGO_CONFIG = {
    // Configuración para logo estilo caricatura (logoInferior)
    caricatura: {
      scale: 0.8,
      marginRight: 0,
      marginBottom: 45,
      offsetX: -45,  // Ajuste adicional horizontal (negativo = más izquierda)
      offsetY: 0   // Ajuste adicional vertical (negativo = más arriba)
    },
    // Configuración para logo estilo realista (logoInferior2)
    realista: {
      scale: 0.8,
      marginRight: 20,    // Ahora actúa como margen izquierdo
      marginBottom: -16,
      offsetX: 0,         // Ajuste adicional horizontal
      offsetY: 0          // Ajuste adicional vertical
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seleccionar el logo según el estilo
    const logoToUse = selectedStyle === "realista" ? logoInferior2 : logoInferior;
    const config = selectedStyle === "realista" ? LOGO_CONFIG.realista : LOGO_CONFIG.caricatura;

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
      loadImage(logoToUse)    // Logo seleccionado dinámicamente
    ])
      .then(([avatar, LogoInf]) => {
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // Logo Inferior: posición según el estilo
        const infWidth = LogoInf.width * config.scale;
        const infHeight = LogoInf.height * config.scale;
        
        // Calcular posición con configuración personalizada
        let posX, posY;
        
        if (selectedStyle === "realista") {
          // Esquina inferior izquierda para realista
          posX = config.marginRight + config.offsetX;
          posY = canvas.height - infHeight - config.marginBottom + config.offsetY;
        } else {
          // Esquina inferior derecha para caricatura
          posX = canvas.width - infWidth - config.marginRight + config.offsetX;
          posY = canvas.height - infHeight - config.marginBottom + config.offsetY;
        }
        
        ctx.drawImage(
          LogoInf,
          posX,
          posY,
          infWidth,
          infHeight
        );

        console.log(`📐 Logo posicionado: X=${Math.round(posX)}, Y=${Math.round(posY)}, Tamaño=${Math.round(infWidth)}x${Math.round(infHeight)}`);

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
