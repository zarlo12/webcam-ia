import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
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
  const [selectedGender, setSelectedGender] = useState<string>(""); // Estado para el género seleccionado
  
  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

  // Función para generar el prompt basado en el género seleccionado
  const getPromptByGender = (gender: string): string => {
    switch (gender) {
      case "hombre":
        return `Transform the uploaded photo into a high-quality 3D caricature style portrait with exaggerated but recognizable facial features. The person must clearly remain the same individual: preserve exact facial structure, eye shape, nose, mouth, skin tone, hairline, and expression identity from the original photo. Do NOT change gender, age, or facial proportions beyond stylized exaggeration. Style details: Semi-realistic 3D caricature, big expressive eyes, slightly enlarged head, smooth skin, detailed facial shading Highly expressive, joyful facial expression, wide smile, energetic pose Clothing: Red soccer jersey with yellow and blue trim on the collar and sleeves White “Claro” logo centered on the chest Jersey fit and fabric texture similar to a professional football uniform Pose: Upper body visible Both fists clenched in front of the chest in a celebratory pose Background: Stadium environment with blurred crowd Warm cinematic lighting Floating confetti and particles in the air Depth of field with strong subject focus Lighting & quality: Dramatic stadium lights High contrast, vibrant colors Ultra high resolution, sharp focus, professional render Important constraints: Do NOT replace the face with another person Do NOT alter facial identity Keep the same character style, jersey, and background for every transformation`;
      case "mujer":
        return `Transform the uploaded photo into a high-quality 3D caricature style portrait with exaggerated but recognizable facial features. The person must clearly remain the same individual: preserve exact facial structure, eye shape, nose, mouth, skin tone, hairline, and expression identity from the original photo. Do NOT change gender, age, or facial proportions beyond stylized exaggeration. Style details: Semi-realistic 3D caricature, big expressive eyes, slightly enlarged head, smooth skin, detailed facial shading Highly expressive, joyful facial expression, wide smile, energetic pose Clothing: Red soccer jersey with yellow and blue trim on the collar and sleeves White “Claro” logo centered on the chest Jersey fit and fabric texture similar to a professional football uniform Pose: Upper body visible Both fists clenched in front of the chest in a celebratory pose Background: Stadium environment with blurred crowd Warm cinematic lighting Floating confetti and particles in the air Depth of field with strong subject focus Lighting & quality: Dramatic stadium lights High contrast, vibrant colors Ultra high resolution, sharp focus, professional render Important constraints: Do NOT replace the face with another person Do NOT alter facial identity Keep the same character style, jersey, and background for every transformation`;
      default:
        return "-";
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
      
      // Cambiar INMEDIATAMENTE a la pantalla de formulario sin esperar
      onProcess(email); // Pasa al formulario mientras la imagen se procesa en background
      
      // Procesar la imagen en background con prompt basado en género
      const prompt = getPromptByGender(selectedGender);
      console.log("Usando prompt:", prompt);
      
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
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
    const testImageUrl = "https://storage.googleapis.com/imagen-ia-845a3.firebasestorage.app/generated-images/business_1761234505975.png";
    
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

    if (!selectedGender) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona tu género.",
      });
      return;
    }

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
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="input"
                required
              >
                <option value="" disabled>
                  Selecciona tu género
                </option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

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
              disabled={!capturedImageUrl || !selectedGender || isProcessing}
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
                display: 'none'
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
