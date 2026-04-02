import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logo_final.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess, onAiImageReady }) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<string>(""); // "terror" o "clasico"
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Estilo específico del modo
  
  const webcamRef = useRef<WebcamRef | null>(null);

  // Función para generar el prompt basado en el modo y estilo seleccionado
  const getPromptByStyle = (mode: string, style: string): string => {
    const baseInstructions = `Transform the person or people in the photo into realistic circus characters. Maintain their facial features, expressions, and recognizable characteristics while applying the transformation. If there are multiple people, transform ALL of them into the same character style. Use photorealistic rendering with professional lighting and textures.`;
    
    const commonEnding = `\n\nEach person should be dressed in a detailed, realistic circus costume appropriate for the character. Place them in a matching circus environment with atmospheric lighting. The background should be immersive and thematic. Maintain photorealism throughout - no cartoons, no exaggerations. Professional photography quality with cinematic color grading.\n\nIf multiple people are present, ensure they all receive the same character transformation while maintaining their individual facial features and positioning. The final image should be vertical (aspect ratio 9:16), optimized for mobile viewing and social media stories. Avoid distortions, extra limbs, duplicated faces, text, logos, or watermarks.`;
    
    // MODO TERROR
    if (mode === "terror") {
      switch (style) {
        case "payaso-maldito":
          return `${baseInstructions}\n\nTransform each person into a realistic Evil Clown character. Dress them in dark, menacing clown costumes with tattered red and black fabric, weathered face paint with sinister smile patterns, wild colorful hair. Their expressions should be unsettling but photorealistic. Place them in a dark abandoned circus tent with dim atmospheric lighting, fog, and shadows. Horror aesthetic with cinematic dark red and purple lighting.${commonEnding}`;
        
        case "dueno-circo-oscuro":
          return `${baseInstructions}\n\nTransform each person into a realistic Dark Circus Master/Ringmaster. Dress them in elegant but sinister ringmaster outfits: black tailcoats with red velvet trim, top hats, ornate details. They should hold vintage canes or whips. Confident, mysterious expressions. Place them center stage in a gothic circus arena with dramatic theatrical lighting, red curtains, and dark atmospheric fog. Victorian horror aesthetic.${commonEnding}`;
        
        case "domador-salvaje":
          return `${baseInstructions}\n\nTransform each person into a realistic Wild Beast Tamer character. Dress them in rugged leather outfits with metal studs, worn boots, protective gear. They should hold whips or chains. Intense, fearless expressions. Place them in a dark circus cage area with dramatic shadows, chains hanging, and moody theatrical lighting. Gritty, dangerous atmosphere with dark browns and reds.${commonEnding}`;
        
        case "acrobata-extremo":
          return `${baseInstructions}\n\nTransform each person into a realistic Extreme Acrobat character. Dress them in dark, form-fitting performance outfits with gothic patterns, straps, and metallic details. Athletic poses suggesting danger and skill. Place them on or near aerial equipment (trapeze, silks, or ropes) high above a dark circus arena. Dramatic upward lighting with red and blue gels, creating an intense, vertigo-inducing atmosphere.${commonEnding}`;
        
        case "pesadilla-circo":
          return `${baseInstructions}\n\nTransform each person into a realistic Circus Nightmare character. Dress them in haunting circus performer outfits mixing vintage and horror elements - torn fabrics, eerie masks or face paint, mysterious accessories. Enigmatic, otherworldly expressions. Place them in a surreal, nightmarish circus setting with distorted perspectives, eerie fog, and unsettling lighting in purples and greens. Dark fantasy aesthetic.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate realistic dark circus characters with horror aesthetic and atmospheric lighting.${commonEnding}`;
      }
    }
    
    // MODO CLÁSICO
    if (mode === "clasico") {
      switch (style) {
        case "payaso-estrella":
          return `${baseInstructions}\n\nTransform each person into a realistic Star Clown character. Dress them in vibrant, professional clown costumes with bright primary colors (red, yellow, blue), polished face paint with cheerful smiles, colorful wigs, bow ties, and oversized buttons. Joyful, entertaining expressions. Place them in a bright, classic circus ring with spotlights, red and white striped big top tent, and warm theatrical lighting. Traditional circus aesthetic with rich, saturated colors.${commonEnding}`;
        
        case "maestro-circo":
          return `${baseInstructions}\n\nTransform each person into a realistic Grand Circus Master/Ringmaster. Dress them in elegant classic ringmaster outfits: red tailcoats with gold trim, white shirts, black bow ties, top hats, white gloves. They should hold decorative batons or megaphones. Confident, charismatic expressions. Place them center stage in a magnificent circus arena with grand curtains, bright spotlights, and classic circus decorations. Luxurious, prestigious atmosphere.${commonEnding}`;
        
        case "domador-legendario":
          return `${baseInstructions}\n\nTransform each person into a realistic Legendary Animal Tamer character. Dress them in classic safari-style outfits with elegant details: fitted jackets, leather boots, decorative belts, holding ceremonial whips or staffs. Noble, commanding expressions. Place them in a grand circus arena with majestic big cats visible in background (safe distance), golden lighting, and luxurious circus decorations. Epic, heroic atmosphere with warm golden tones.${commonEnding}`;
        
        case "acrobata-profesional":
          return `${baseInstructions}\n\nTransform each person into a realistic Professional Acrobat character. Dress them in elegant, form-fitting performance outfits in vibrant colors (gold, silver, blue) with sequins and graceful design. Athletic poses showing strength and elegance. Place them on or near circus apparatus (trapeze, rings, or silks) in a beautiful circus setting with warm spotlights, sparkles, and classic circus atmosphere. Glamorous, sophisticated aesthetic.${commonEnding}`;
        
        case "artista-espectaculo":
          return `${baseInstructions}\n\nTransform each person into a realistic Spectacular Performer character. Dress them in dazzling circus costumes with sequins, feathers, and elaborate details in bright jewel tones. Showman poses with arms wide or holding props (juggling items, magic wands, or ribbons). Enthusiastic, captivating expressions. Place them in a grand circus stage with spotlights, confetti, sparkles, and audience blur in background. Celebratory, magical atmosphere with golden and warm lighting.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate realistic classic circus characters with vibrant colors and warm theatrical lighting.${commonEnding}`;
      }
    }
    
    // Fallback
    return `${baseInstructions}\n\nCreate realistic circus characters with professional costumes and atmospheric circus environment.${commonEnding}`;
  };

  // Función para capturar la imagen desde el componente WebcamScene
  const handleCapture = async () => {
    if (webcamRef.current && webcamRef.current.captureImage) {
      try {
        const blob = await webcamRef.current.captureImage();
        setCapturedImage(blob);
        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
      } catch (error) {
        console.error("Error al capturar la imagen:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo capturar la imagen. Inténtalo de nuevo.",
        });
      }
    }
  };

  // Handler para cambio de modo (resetea el estilo seleccionado)
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    setSelectedStyle(""); // Resetear estilo al cambiar de modo
  };

  // Procesa la imagen con el prompt del modo y estilo seleccionado
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      console.log("🚀 Procesando imagen con IA...");
      console.log(`🎭 Modo: ${selectedMode}, Estilo: ${selectedStyle}`);
      
      // Convertir la imagen original (capturedImage) a data URL para pasarla al parent
      const reader = new FileReader();
      const originalImageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });
      
      // Cambiar INMEDIATAMENTE a la pantalla de espera sin esperar
      onProcess(email);
      
      // Procesar la imagen en background con prompt basado en modo y estilo
      const prompt = getPromptByStyle(selectedMode, selectedStyle);
      console.log(`📝 Prompt generado para transformación realista`);
      
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        '',
        "user-" + Date.now()
      );

      if (result.success && result.imageUrl) {
        console.log("✅ Imagen generada exitosamente:", result.imageUrl);
        // Pasar tanto la imagen generada como la original al parent
        onAiImageReady(result.imageUrl, originalImageDataUrl);
        
      } else {
        console.error("❌ Error al generar imagen:", result.error);
      }

    } catch (error) {
      console.error("❌ Error al procesar la imagen:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función temporal para pruebass con imagen fija
  
  const handleTestWithFixedImage = () => {
    const testImageUrl = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/CasaReina1%2F-1773594771102.png?alt=media&token=732ba120-4f1e-4b39-a219-210ef29ee09e";
    const testOriginalImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // Imagen de prueba 1x1
    
    console.log("🧪 Iniciando prueba con imagen fija:", testImageUrl);
    
    // Cambiar inmediatamente al formulario
    onProcess(email);
    
    // Simular un breve delay y luego notificar que la imagen está lista
    setTimeout(() => {
      console.log("🧪 Imagen de prueba lista");
      onAiImageReady(testImageUrl, testOriginalImageUrl);
    }, 1000); // 2 segundos de delay para simular procesamiento
  };


  // Permite reiniciar la captura para tomar otra foto
  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
    setSelectedMode("");
    setSelectedStyle("");
  };

  // Validación del formulario y envío de la imagen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Primero toma una foto.",
      });
      return;
    }

    if (!selectedMode) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un modo (Terror o Clásico).",
      });
      return;
    }

    if (!selectedStyle) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un estilo de personaje.",
      });
      return;
    }

    if (isProcessing) {
      return; // Evitar múltiples envíos
    }

    handleProcessImage();
  };

  return (
    <div className="container">
      {/* Cabecera superior con fondo rojo y logo centrado */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
      <div className="main-content">
        <div className="card">
          {/* <h2 className="subtitle">AVATAR AI</h2> */}
          <div className="avatar-container cam">
            {capturedImageUrl ? (
              // Si ya se capturó la imagen, se muestra la imagen fija
              <img
                src={capturedImageUrl}
                alt="Foto capturada"
                className="fotoCapturada"
              />
            ) : (
              // Si no, se muestra el feed en vivo de la cámara
              <WebcamScene ref={webcamRef} />
            )}
          </div>

          <div className="buttons-container">
            {/* Selector de MODO */}
            <div className="select-container">
              <select
                value={selectedMode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="input"
                required
              >
                <option value="" disabled>
                  Selecciona Modo
                </option>
                <option value="terror">😈 MODO TERROR</option>
                <option value="clasico">✨ MODO CLÁSICO</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

            {/* Selector de ESTILO (condicional según el modo) */}
            {selectedMode && (
              <div className="select-container">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="input"
                  required
                >
                  <option value="" disabled>
                    Selecciona Personaje
                  </option>
                  {selectedMode === "terror" && (
                    <>
                      <option value="payaso-maldito">🤡 Payaso Maldito</option>
                      <option value="dueno-circo-oscuro">🎪 Dueño del Circo Oscuro</option>
                      <option value="domador-salvaje">🦁 Domador Salvaje</option>
                      <option value="acrobata-extremo">🎭 Acróbata Extremo</option>
                      <option value="pesadilla-circo">👻 Pesadilla del Circo</option>
                    </>
                  )}
                  {selectedMode === "clasico" && (
                    <>
                      <option value="payaso-estrella">🤡 Payaso Estrella</option>
                      <option value="maestro-circo">🎪 Gran Maestro del Circo</option>
                      <option value="domador-legendario">🦁 Domador Legendario</option>
                      <option value="acrobata-profesional">🎭 Acróbata Profesional</option>
                      <option value="artista-espectaculo">🎟️ Artista del Espectáculo</option>
                    </>
                  )}
                </select>
                <span className="select-arrow">▼</span>
              </div>
            )}

            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
              disabled={isProcessing}
            >
              {capturedImageUrl ? "Tomar otra" : "Tomar foto"}
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="button"
              disabled={!capturedImageUrl || isProcessing}
            >
              {isProcessing ? "Generando..." : "Procesar"}
            </button>
            
            {/* Botón temporal para pruebas */}
            {<button
              type="button"
              className="button test-button"
              onClick={handleTestWithFixedImage}
              style={{ 
                marginTop: "10px",
                backgroundColor: "#ff9900",
                fontSize: "14px",
                display: "none",
              }}
            >
              🧪 PRUEBA CON IMAGEN FIJA
            </button> }
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
