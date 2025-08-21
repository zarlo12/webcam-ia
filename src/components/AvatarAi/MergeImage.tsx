import React, { useRef, useEffect } from "react";
import logoSuperior from '../../assets/clarosport/Logo.png'

// Importar logos de servicios
import revista15minutos from '../../assets/clarosport/2-revista15minutos.png'
import reaserch from '../../assets/clarosport/3-reaserch.png'
import plazaclaro from '../../assets/clarosport/4-plazaclaro.png'
import uncafeclaro from '../../assets/clarosport/5-uncafeclaro.png'
import salud1010 from '../../assets/clarosport/6-salud1010.png'
import claromusica from '../../assets/clarosport/7-claromusica.png'
import portalredamas from '../../assets/clarosport/8-portalredamas.png'
import mobilemarketing from '../../assets/clarosport/9-mobilemarketing.png'
import radiolatv from '../../assets/clarosport/10-radiolatv.png'
interface MergeImageProps {
  imageUrl: string; // URL de la imagen principasl (avatar)
  onMerged: (mergedDataUrl: string) => void; // Callback para retornar la imagen fusionada
  tipoSuenio: string;
  selectedService?: string; // Servicio seleccionado del cuestionario
}

const MergeImage: React.FC<MergeImageProps> = ({
  imageUrl,
  onMerged,
  tipoSuenio,
  selectedService,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🎯 MAPEO DE SERVICIOS A LOGOS
  const serviceLogs: { [key: string]: string } = {
    "15 minutos": revista15minutos,
    "reaserch": reaserch,
    "plaza claro": plazaclaro,
    "Un café claro": uncafeclaro,
    "Salud 1010": salud1010,
    "Claro Musica": claromusica,
    "portal redmas.com.co": portalredamas,
    "mobile marketing": mobilemarketing,
    "radiola tv": radiolatv,
    "Sin Limites tv": radiolatv // Usar el mismo logo que radiola tv por ahora
  };

  // 🎯 CONFIGURACIÓN DE POSICIÓN Y TAMAÑO PARA CADA LOGO INFERIOR
  const logoInferiorConfig: { [key: string]: { scale: number; marginRight: number; marginBottom: number; offsetX: number; offsetY: number } } = {
    "15 minutos": {
      scale: 0.3,           // Tamaño del logo (30% del ancho del canvas)
      marginRight: 20,      // Margen desde el borde derecho
      marginBottom: 20,     // Margen desde el borde inferior
      offsetX: 0,           // Offset adicional horizontal (negativo = más izquierda)
      offsetY: 0            // Offset adicional vertical (negativo = más arriba)
    },
    "reaserch": {
      scale: 0.25,
      marginRight: 15,
      marginBottom: 25,
      offsetX: -10,
      offsetY: 5
    },
    "plaza claro": {
      scale: 0.3,
      marginRight: 25,
      marginBottom: 15,
      offsetX: 6,
      offsetY: -5
    },
    "Un café claro": {
      scale: 0.28,
      marginRight: 18,
      marginBottom: 22,
      offsetX: 0,
      offsetY: 0
    },
    "Salud 1010": {
      scale: 0.32,
      marginRight: 22,
      marginBottom: 18,
      offsetX: -5,
      offsetY: 3
    },
    "Claro Musica": {
      scale: 0.29,
      marginRight: 20,
      marginBottom: 20,
      offsetX: 0,
      offsetY: 0
    },
    "portal redmas.com.co": {
      scale: 0.18,
      marginRight: 16,
      marginBottom: 24,
      offsetX: -9,
      offsetY: 3
    },
    "mobile marketing": {
      scale: 0.14,
      marginRight: 21,
      marginBottom: 19,
      offsetX: 3,
      offsetY: -2
    },
    "radiola tv": {
      scale: 0.33,
      marginRight: 23,
      marginBottom: 17,
      offsetX: 2,
      offsetY: -3
    },
    "Sin Limites tv": {
      scale: 0.30,
      marginRight: 20,
      marginBottom: 20,
      offsetX: 0,
      offsetY: 0
    }
  };

  // 🎯 CONSTANTES PARA EL LOGO SUPERIOR
  const LOGO_SCALE = 0.3;             // Tamaño del logo (50% del ancho del canvas)
  const LOGO_MARGIN_TOP = -40;         // Margen desde el borde superior
  const LOGO_MARGIN_LEFT = 20;        // Margen desde el borde izquierdo

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

    // Obtener logo inferior basado en el servicio seleccionado
    const logoInferiorSrc = selectedService ? serviceLogs[selectedService] : null;
    const logoConfig = selectedService ? logoInferiorConfig[selectedService] : null;

    // Preparar array de imágenes a cargar
    const imagesToLoad = [
      loadImage(imageUrl),    // avatar
      loadImage(logoSuperior) // logo superior
    ];

    // Agregar logo inferior si existe
    if (logoInferiorSrc) {
      imagesToLoad.push(loadImage(logoInferiorSrc));
    }

    Promise.all(imagesToLoad)
      .then((loadedImages) => {
        const [avatar, logo, logoInferior] = loadedImages;
        // Ajustamos el canvas al tamaño del avatar
        canvas.width = avatar.width;
        canvas.height = avatar.height;

        // Dibujar avatar completo
        ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

        // 🏷️ DIBUJAR EL LOGO SUPERIOR A LA IZQUIERDA
        const logoWidth = canvas.width * LOGO_SCALE;
        const logoHeight = (logo.height / logo.width) * logoWidth; // Mantener proporción
        const logoX = LOGO_MARGIN_LEFT; // Alineado a la izquierda con margen
        const logoY = LOGO_MARGIN_TOP; // Margen desde arriba

        ctx.drawImage(
          logo,
          logoX,
          logoY,
          logoWidth,
          logoHeight
        );

        // 🏷️ DIBUJAR EL LOGO INFERIOR DERECHO (DINÁMICO BASADO EN SERVICIO)
        if (logoInferior && logoConfig && selectedService) {
          const logoInfWidth = canvas.width * logoConfig.scale;
          const logoInfHeight = (logoInferior.height / logoInferior.width) * logoInfWidth; // Mantener proporción
          
          // Calcular posición (parte inferior derecha con configuración personalizada)
          const logoInfX = canvas.width - logoInfWidth - logoConfig.marginRight + logoConfig.offsetX;
          const logoInfY = canvas.height - logoInfHeight - logoConfig.marginBottom + logoConfig.offsetY;

          ctx.drawImage(
            logoInferior,
            logoInfX,
            logoInfY,
            logoInfWidth,
            logoInfHeight
          );

          console.log(`🏷️ Logo inferior "${selectedService}" añadido: Posición: (${Math.round(logoInfX)}, ${Math.round(logoInfY)}) - Tamaño: ${Math.round(logoInfWidth)}x${Math.round(logoInfHeight)}`);
        }

        console.log(`🏷️ Logo superior añadido: Posición: (${Math.round(logoX)}, ${Math.round(logoY)}) - Tamaño: ${Math.round(logoWidth)}x${Math.round(logoHeight)}`);

        // Convertir a Data URL y pasar al callback
        const mergedDataUrl = canvas.toDataURL("image/png");
        onMerged(mergedDataUrl);
      })
      .catch((error) => {
        console.error("Error al cargar las imágenes:", error);
      });
  }, [imageUrl, onMerged, tipoSuenio, selectedService]); // Agregamos selectedService a las dependencias

  // Canvas oculto
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default MergeImage;
