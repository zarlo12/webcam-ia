import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

// Enum para el género
enum Gender {
  MALE = "male",
  FEMALE = "female",
}

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
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.MALE);
  
  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

  // Función para obtener el prompt según el género seleccionadoe
  const getPromptByGender = (gender: Gender): string => {
    switch (gender) {
      case Gender.MALE:
        return "Transform the photo of a man into a Nutcracker soldier while preserving his original facial features, hair, and expression. He should wear an ornate red and gold military-style uniform with gold buttons, shoulder epaulettes, a tall red shako hat with gold trim and a white plume. The lighting should be warm and festive, evoking a classic Christmas atmosphere, with cinematic detail, professional studio lighting, and shallow depth of field. Ultra-realistic, high detail, maintaining skin tone and identity accuracy.";
      case Gender.FEMALE:
        return "Transform the photo of a woman into a Nutcracker ballerina while preserving her original facial features, hair, and smile. She should wear a red satin ballet bodice with gold embroidery and a white tulle tutu, standing gracefully in a ballet pose on pointe shoes. The background should have warm Christmas lights and a softly lit festive atmosphere, with cinematic studio lighting, realistic shadows, and shallow depth of field. Ultra-realistic, elegant, detailed, maintaining natural skin tone and identity accuracy.";
      default:
        return "";
    }
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

  // Procesa la imagen usando el nuevo servicio de IA
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      console.log("Procesando imagen con IA...");
      console.log("Género seleccionado:", selectedGender);
      
      // Obtener el prompt según el género seleccionado
      const genderPrompt = getPromptByGender(selectedGender);
      console.log("Prompt generado:", genderPrompt);
      
      // Cambiar INMEDIATAMENTE a la pantalla de formulario sin esperar
      onProcess(email); // Pasa al formulario mientras la imagen se procesa en background
      
      // Procesar la imagen en background con el prompt específico del género
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        genderPrompt, // Usar el prompt específico del género
        '',
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

  // Función temporal para pruebass con imagen fija
  
  const handleTestWithFixedImage = () => {
    const testImageUrl = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/Banistmo_avatars%2F-1760224878549.png?alt=media&token=afa94389-c564-4a92-844b-70edfa06451d";
    
    console.log("🧪 Iniciando prueba con imagen fija:", testImageUrl);
    
    // Cambiar inmediatamente al formulario
    onProcess(email);
    
    // Simular un breve delay y luego notificar que la imagen está lista
    setTimeout(() => {
      console.log("🧪 Imagen de prueba lista");
      onAiImageReady(testImageUrl);
    }, 1000); // 2 segundos de delay para simular procesamiento
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
            {/* Selector de género */}
            <div className="select-container">
              <label htmlFor="gender-select" className="select-label">
      
              </label>
              <select
                id="gender-select"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value as Gender)}
                className="gender-select"
              >
                <option value={Gender.MALE}>👨 Hombre</option>
                <option value={Gender.FEMALE}>👩 Mujer</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

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
                display: 'block'
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
