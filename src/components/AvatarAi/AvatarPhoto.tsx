import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/colgate/Logo.png";
import WebcamScene from "../WebcamScene";
import aiImageService, { ImageStyle } from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
  onAiImageReady: (imageUrl: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess, onAiImageReady }) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.ARTISTIC);

  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

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

  // Procesa la imagen usando el nuevo servicio de IA
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      console.log("Procesando imagen con IA...");
      
      // Cambiar INMEDIATAMENTE a la pantalla de formulario sin esperar
      onProcess(email); // Pasa al formulario mientras la imagen se procesa en background
      
      // Procesar la imagen en background
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        "CLASSICAL PAINTED PORTRAIT: Create a museum-quality oil painting portrait of this dental professional, preserving their exact facial features and identity. MANDATORY: This MUST be a traditional painted portrait, NOT a photograph. Three-quarter body composition showing torso, arms, and hands completely visible. The person wears a light beige clinical coat and teal/navy collared shirt, positioned centrally looking at viewer. PAINTED STYLE REQUIRED: Choose between (1) Classical oil painting with rich impasto brushstrokes and glazing techniques, (2) Hyperrealistic illustration with painterly precision and artistic interpretation, or (3) Impressionistic style with bold, visible brushstrokes and artistic color mixing. The painting shows clear evidence of being hand-painted with brush textures, paint layers, and artistic interpretation - never photographic. PROMINENT RIM LIGHTING: Add a strong, warm golden rim light that creates a bold glowing outline around the entire silhouette - hair, shoulders, arms, hands, and body contour. This backlight effect should be thick, radiant, and clearly visible, separating the figure dramatically from the background. DENTAL OFFICE BACKGROUND: Paint a recognizable dental office setting with chairs, equipment, and medical cabinets, rendered with soft painterly brushstrokes. ARTISTIC EXECUTION: Emphasize paint texture, visible brushwork, artistic color choices, and traditional portrait painting techniques. Warm palette with beige, amber, and teal tones. Professional yet approachable expression with genuine smile.",
        selectedStyle,
        "user-" + Date.now()
      );

      if (result.success && result.imageUrl) {
        console.log("Imagen generada exitosamente:", result.imageUrl);
        // La imagen estará disponible para el botón dinámico en Waiting
        onAiImageReady(result.imageUrl); // Notificar que la imagen de IA está lista con su URL
        
      } else {
        console.error("Error al generar imagen:", result.error);
      }

    } catch (error) {
      console.error("Error al procesar la imagen:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función temporal para pruebas con imagen fija
  const handleTestWithFixedImage = () => {
    const testImageUrl = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/colgate%2F-1755277712540.png?alt=media&token=884dd5f1-cb1d-477d-a216-369771adab43";
    
    console.log("🧪 Iniciando prueba con imagen fija:", testImageUrl);
    
    // Cambiar inmediatamente al formulario
    onProcess(email);
    
    // Simular un breve delay y luego notificar que la imagen está lista
    setTimeout(() => {
      console.log("🧪 Imagen de prueba lista");
      onAiImageReady(testImageUrl);
    }, 2000); // 2 segundos de delay para simular procesamiento
  };

  // Permite reiniciar la captura para tomar otra foto
  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
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
            {/* Selector de estilo de IA */}
            {/* <div className="select-container">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as ImageStyle)}
              >
                <option value={ImageStyle.PROFESSIONAL}>Profesional</option>
                <option value={ImageStyle.REALISTIC}>Realista</option>
                <option value={ImageStyle.ARTISTIC}>Artístico</option>
                <option value={ImageStyle.CARTOON}>Cartoon</option>
                <option value={ImageStyle.VINTAGE}>Vintage</option>
              </select>
              <span className="select-arrow">▼</span>
            </div> */}

            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
              disabled={isProcessing}
            >
              <div
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {capturedImageUrl ? "Tomar otra" : "Tomar foto"}
              </div>
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
            <button
              type="button"
              className="button test-button"
              onClick={handleTestWithFixedImage}
              style={{ 
                marginTop: "10px",
                backgroundColor: "#ff9900",
                fontSize: "14px"
              }}
            >
              🧪 PRUEBA CON IMAGEN FIJA
            </button>
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
