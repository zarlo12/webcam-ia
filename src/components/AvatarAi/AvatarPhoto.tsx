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
  const [selectedGender] = useState<string>("hombre"); // Género por defecto: hombre
  
  // Estados para los términos y condiciones
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptHabeasData, setAcceptHabeasData] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showHabeasModal, setShowHabeasModal] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  
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
        return `CRITICAL GLOBAL RULE (APPLIES TO ENTIRE IMAGE):
The image must contain ZERO brand logos, ZERO sports brands, ZERO sponsor graphics, ZERO text, and ZERO symbols anywhere — EXCEPT for one single allowed logo: "Claro".
If any other logo, brand, symbol, text, stripes, swoosh, badge, or marking appears, it must be completely removed.

Transform the uploaded photo into a high-quality 3D caricature style portrait with exaggerated but recognizable facial features. The person must remain the same individual: preserve exact facial structure, eye shape, nose, mouth, skin tone, hairline, and identity from the original photo. Do NOT change gender, age, or facial proportions beyond stylized exaggeration.

FINAL IMAGE COMPOSITION (ABSOLUTE PRIORITY):
The final image must be vertically structured in two fixed sections:
1) TOP section → character and background
2) BOTTOM section → template_abajo.png

The composition must be built starting from the template, not added later.

CANVAS RULE:
- Vertical poster format (4:5 or 9:16)
- The template defines the full width

BOTTOM TEMPLATE (HARD CONSTRAINT):
- template_abajo.png must be base layer
- Full width (100%), bottom aligned
- Occupies 30–40% height
- Never crop, never shrink, never cover

TOP SECTION:
- Character fully above the template
- Upper body, celebratory fists pose

CLOTHING (VERY IMPORTANT):
- Plain yellow shirt (generic, non-branded, not a real soccer jersey)
- Do NOT create a real team uniform
- Do NOT include any decorative elements that resemble sports brands

LOGO (ONLY EXCEPTION):
- Add ONLY the word "Claro"
- Centered on chest
- Solid vivid red
- Clean and readable
- This must be the ONLY visible graphic on the shirt

STYLE:
Semi-realistic 3D caricature, expressive eyes, smooth skin, joyful expression, high detail.

BACKGROUND:
Stadium, blurred crowd, cinematic lighting, confetti.

QUALITY:
Ultra high resolution, sharp focus, vibrant colors.

FINAL ENFORCEMENT:
The template always wins over everything.
The shirt must contain ONLY the Claro logo and nothing else.`;
      case "mujer":
        return `CRITICAL GLOBAL RULE (APPLIES TO ENTIRE IMAGE):
The image must contain ZERO brand logos, ZERO sports brands, ZERO sponsor graphics, ZERO text, and ZERO symbols anywhere — EXCEPT for one single allowed logo: "Claro".
If any other logo, brand, symbol, text, stripes, swoosh, badge, or marking appears, it must be completely removed.

Transform the uploaded photo into a high-quality 3D caricature style portrait with exaggerated but recognizable facial features. The person must remain the same individual: preserve exact facial structure, eye shape, nose, mouth, skin tone, hairline, and identity from the original photo. Do NOT change gender, age, or facial proportions beyond stylized exaggeration.

FINAL IMAGE COMPOSITION (ABSOLUTE PRIORITY):
The final image must be vertically structured in two fixed sections:
1) TOP section → character and background
2) BOTTOM section → template_abajo.png

The composition must be built starting from the template, not added later.

CANVAS RULE:
- Vertical poster format (4:5 or 9:16)
- The template defines the full width

BOTTOM TEMPLATE (HARD CONSTRAINT):
- template_abajo.png must be base layer
- Full width (100%), bottom aligned
- Occupies 30–40% height
- Never crop, never shrink, never cover

TOP SECTION:
- Character fully above the template
- Upper body, celebratory fists pose

CLOTHING (VERY IMPORTANT):
- Plain yellow shirt (generic, non-branded, not a real soccer jersey)
- Do NOT create a real team uniform
- Do NOT include any decorative elements that resemble sports brands

LOGO (ONLY EXCEPTION):
- Add ONLY the word "Claro"
- Centered on chest
- Solid vivid red
- Clean and readable
- This must be the ONLY visible graphic on the shirt

STYLE:
Semi-realistic 3D caricature, expressive eyes, smooth skin, joyful expression, high detail.

BACKGROUND:
Stadium, blurred crowd, cinematic lighting, confetti.

QUALITY:
Ultra high resolution, sharp focus, vibrant colors.

FINAL ENFORCEMENT:
The template always wins over everything.
The shirt must contain ONLY the Claro logo and nothing else.`;
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

  // Función para continuar después de aceptar los términos
  const handleContinue = () => {
    if (acceptTerms && acceptHabeasData) {
      setTermsAccepted(true);
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

    handleProcessImage();
  };

  return (
    <div className="container">
      {/* Cabecera superior con fondo rojo y logo centrado */}
      <div className="header" style={{display: "none"}}>
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
      <div className="main-content">
        <div className="card">
          {/* Pantalla de Términos y Condiciones */}
          {!termsAccepted ? (
            <div className="terms-section">
              <h2 className="terms-title">Términos y Condiciones</h2>
              <p className="terms-subtitle">Por favor, acepta los siguientes términos para continuar</p>
              
              <div className="terms-checkboxes">
                <div className="checkbox-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">
                      Acepto uso de datos y video{" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setShowTermsModal(true)}
                      >
                        (Ver términos)
                      </button>
                    </span>
                  </label>
                </div>

                <div className="checkbox-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={acceptHabeasData}
                      onChange={(e) => setAcceptHabeasData(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">
                      Acepto Habeas Data{" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setShowHabeasModal(true)}
                      >
                        (Ver habeas data)
                      </button>
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                className="button button-continue"
                onClick={handleContinue}
                disabled={!acceptTerms || !acceptHabeasData}
              >
                Continuar
              </button>
            </div>
          ) : (
            /* Pantalla de Captura de Foto */
            <>
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
                    display: 'none'
                  }}
                >
                  🧪 PRUEBA CON IMAGEN FIJA
                </button> }
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal de Términos - PDF */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Términos y Condiciones</h3>
              <button
                className="modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <iframe
                src="https://firebasestorage.googleapis.com/v0/b/claro-canta-dev.firebasestorage.app/o/AUTORIZACION%20USO%20DE%20IMAGENES%20BMV.pdf?alt=media&token=36c717bc-ca85-43d0-a6a9-5363247b3c3f"
                title="Términos y Condiciones"
                className="pdf-viewer"
              />
            </div>
            <div className="modal-footer">
              <button
                className="button button-modal"
                onClick={() => setShowTermsModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Habeas Data */}
      {showHabeasModal && (
        <div className="modal-overlay" onClick={() => setShowHabeasModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Habeas Data</h3>
              <button
                className="modal-close"
                onClick={() => setShowHabeasModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                MARCAS VITALES BMV SAS obrando en nombre de Claro Colombia y en calidad de 
                encargado del tratamiento de los datos personales obtenidos a través del presente 
                formato, solicita su autorización de manera previa, libre, expresa, informada y 
                voluntaria para el tratamiento de estos. Lo anterior con el fin de enviar o tratar 
                información promocional y/o publicitaria de la marca Claro, Los derechos que le 
                asisten como titular son: conocer, actualizar, rectificar y suprimir su información 
                personal de nuestras bases de datos, de los cuales podrá conocer su finalidad dentro 
                de nuestra Política de Tratamientos de Datos relacionada en la página web{" "}
                <a 
                  href="https://mvitales.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  https://mvitales.com/
                </a>
                . Usted podrá hacer valer sus peticiones, quejas o reclamos a través de comunicación 
                escrita al correo: info@mvitales.com, Con la firma de este documento autorizo a la 
                compañía de manera expresa e inequívoca a recolectar, almacenar, usar y tratar los 
                datos que he suministrado.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="button button-modal"
                onClick={() => setShowHabeasModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarPhoto;
