import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/colgate/Logo.png";
import WebcamScene from "../WebcamScene";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (imageBlob: Blob) => void;
  onAiImageReady: (imageUrl: string) => void;
  capturedImageBlob?: Blob | null;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ 
  onProcess, 
  onAiImageReady, 
  capturedImageBlob
}) => {
  const [capturedImage, setCapturedImage] = useState<Blob | null>(capturedImageBlob || null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing] = useState<boolean>(false);
  
  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

  // Efecto para manejar imagen preexistente cuando volvemos de las preguntas
  React.useEffect(() => {
    if (capturedImageBlob && !capturedImageUrl) {
      const url = URL.createObjectURL(capturedImageBlob);
      setCapturedImageUrl(url);
      setCapturedImage(capturedImageBlob);
    }
  }, [capturedImageBlob]);

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

    // Siempre enviamos a las preguntas al hacer submit
    onProcess(capturedImage);
  };

  // Función temporal para pruebass con imagen fija
  const handleTestWithFixedImage = () => {
    const testImageUrl = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/generated-images%2Fgenerated_974e631f-effe-4a1a-83c8-563c1b081bed.jpg?alt=media&token=85b431a1-63d3-4487-b0ec-223ee722ff27";
    
    console.log("🧪 Iniciando prueba con imagen fija:", testImageUrl);
    
    // Simular captura de imagen para pruebas
    if (capturedImage) {
      onProcess(capturedImage);
    }
    
    // Simular un breve delay y luego notificar que la imagen está lista
    setTimeout(() => {
      console.log("🧪 Imagen de prueba lista");
      onAiImageReady(testImageUrl);
    }, 1000); // 1 segundo de delay para simular procesamiento
  };

  // Permite reiniciar la captura para tomar otra foto
  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
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
            {<button
              type="button"
              className="button test-button"
              onClick={handleTestWithFixedImage}
              style={{ 
                marginTop: "10px",
                backgroundColor: "#ff9900",
                fontSize: "14px",
                //display: 'none'
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
