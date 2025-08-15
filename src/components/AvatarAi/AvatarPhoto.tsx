import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/colgate/Logo.png";
import WebcamScene from "../WebcamScene";
import aiImageService, { ImageStyle } from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess }) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.REALISTIC);

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
      
      // Mostrar alerta de procesamiento
      Swal.fire({
        title: "Generando tu imagen con IA",
        text: "Esto puede tomar unos minutos...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Usar flux-kontext-pro para máximo realismo y preservación facial
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        "Transform this person into a professional dentist while keeping the same facial features and identity. They are wearing a clean white medical coat and have a stethoscope around their neck. The background is a modern, bright dental clinic with a dental chair, medical equipment, and professional medical lighting. Ultra-realistic medical photography style.",
        selectedStyle,
        "user-" + Date.now()
      );

      if (result.success && result.imageUrl) {
        console.log("Imagen generada exitosamente:", result.imageUrl);
        
        // Cerrar loading y cambiar de pantalla
        Swal.close();
        onProcess(email);
        
        // Opcional: Mostrar éxito
        setTimeout(() => {
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Tu imagen ha sido generada con IA",
            timer: 2000,
            showConfirmButton: false
          });
        }, 500);
        
      } else {
        throw new Error(result.error || "Error desconocido al generar la imagen");
      }

    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      
      Swal.fire({
        icon: "error",
        title: "Error al procesar",
        text: error instanceof Error ? error.message : "Hubo un problema al generar tu imagen con IA. Inténtalo de nuevo.",
      });
    } finally {
      setIsProcessing(false);
    }
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
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
