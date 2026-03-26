import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
// import logo from "../../assets/img/empresas.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string, name: string) => void;
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
  const [personName, setPersonName] = useState<string>(""); // Estado para el nombre de la persona (YA EXISTE)
  
  // Estados para términos y condiciones
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptHabeasData, setAcceptHabeasData] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showHabeasDataModal, setShowHabeasDataModal] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  
  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

  // Función para generar el prompt basado en el nombre de la persona
  const getPromptByGender = (name: string): string => {
    return `CRITICAL GLOBAL RULE (APPLIES TO ENTIRE IMAGE):
The final image must contain ZERO brand logos, ZERO sports brands, ZERO sponsor graphics, ZERO extra text, and ZERO symbols that were not originally part of the template.
Do NOT generate, add, recreate, or hallucinate any logos, icons, badges, stripes, swooshes, or brand-like elements.
If any unintended graphic appears, it must be completely removed.

TEMPLATE PRIORITY RULE:
Use "template.png" as the absolute base and final composition.
Everything in the template must remain EXACTLY the same, including existing logos, layout, colors, icons, and design elements.

PRIMARY TASK:
Replace ONLY the person in the template with the person from the uploaded photo.

IDENTITY PRESERVATION:
The face must match the uploaded person exactly:
- same identity
- same skin tone
- same facial features
- natural integration into the body

INTEGRATION RULE:
Blend the face naturally into the body so it looks realistic and professional.
Do NOT alter lighting, shadows, or color grading of the template.

TEXT CHANGE (ONLY ALLOWED MODIFICATION):
Change the name "DIANA RUÍZ" to:
"${name.toUpperCase()}"

Keep:
- same font
- same size
- same style
- same position

STRICT IMMUTABILITY RULE:
Do NOT change anything else in the image:
- Do NOT modify colors
- Do NOT modify background
- Do NOT modify logos already present in the template
- Do NOT add new logos or graphics
- Do NOT move or resize elements
- Do NOT add details to clothing
- Do NOT enhance or redesign any part of the template

FINAL ENFORCEMENT:
The template always wins over everything.
The ONLY changes allowed are:
1) replacing the face/person
2) updating the name text

Any other modification is strictly forbidden.`;
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
      onProcess(email, personName); // Pasa al formulario mientras la imagen se procesa en background
      
      // Procesar la imagen en background con prompt basado en género y nombre
      const prompt = getPromptByGender(personName);
      console.log("Usando prompt:", prompt);
      
      const result = await aiImageService.generateCaricatureWithTemplate(
        capturedImage,
        prompt,
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
    onProcess(email, personName);
    
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

  // Manejar continuación después de aceptar términos
  const handleContinueTerms = () => {
    if (acceptTerms && acceptHabeasData && personName.trim()) {
      setTermsAccepted(true);
    }
  };

  // Validación del formulario y envío de la imagen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor ingresa tu nombre.",
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
      

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
      <div className="main-content">
        <div className="card">
          {/* <h2 className="subtitle">AVATAR AI</h2> */}
          
          {!termsAccepted ? (
            // Pantalla de términos y condiciones
            <div className="terms-container">
              <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Bienvenido</h2>
              
              {/* Input de nombre */}
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="input"
                required
                style={{ marginBottom: '20px', width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', border: '2px solid #fff' }}
              />

              {/* Checkboxes */}
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="terms" style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                    Acepto uso de datos y video{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      style={{ color: '#ffeb3b', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      (Ver términos)
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="habeasData"
                    checked={acceptHabeasData}
                    onChange={(e) => setAcceptHabeasData(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="habeasData" style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                    Acepto Habeas Data{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowHabeasDataModal(true);
                      }}
                      style={{ color: '#ffeb3b', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      (Ver habeas data)
                    </span>
                  </label>
                </div>
              </div>

              {/* Botón Continuar */}
              <button
                type="button"
                className="button"
                onClick={handleContinueTerms}
                disabled={!acceptTerms || !acceptHabeasData || !personName.trim()}
                style={{ width: '100%', marginTop: '20px' }}
              >
                Continuar
              </button>
            </div>
          ) : (
            // Pantalla de captura de foto
            <>
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
                  disabled={!capturedImageUrl || !selectedGender || !personName.trim() || isProcessing}
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

      {/* Modal de Términos y Condiciones (PDF) */}
      {showTermsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '15px',
              padding: '20px',
              maxWidth: '90%',
              maxHeight: '90vh',
              width: '800px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTermsModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px 10px',
                lineHeight: '1',
              }}
            >
              ×
            </button>
            <h2 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '22px', fontWeight: '600' }}>
              Términos y Condiciones
            </h2>
            <iframe
              src="https://firebasestorage.googleapis.com/v0/b/claro-canta-dev.firebasestorage.app/o/AUTORIZACION%20USO%20DE%20IMAGENES%20BMV.pdf?alt=media&token=36c717bc-ca85-43d0-a6a9-5363247b3c3f"
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: '8px',
              }}
              title="Términos y Condiciones"
            />
          </div>
        </div>
      )}

      {/* Modal de Habeas Data */}
      {showHabeasDataModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowHabeasDataModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '90%',
              maxHeight: '90vh',
              width: '700px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHabeasDataModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px 10px',
                lineHeight: '1',
              }}
            >
              ×
            </button>
            <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '22px', fontWeight: '600' }}>
              Habeas Data
            </h2>
            <p style={{
              color: '#555',
              fontSize: '15px',
              lineHeight: '1.6',
              textAlign: 'justify',
              margin: 0,
            }}>
              MARCAS VITALES BMV SAS obrando en nombre de Claro Colombia y en calidad de encargado del tratamiento de los datos personales obtenidos a través del presente formato, solicita su autorización de manera previa, libre, expresa, informada y voluntaria para el tratamiento de estos. Lo anterior con el fin de enviar o tratar información promocional y/o publicitaria de la marca Claro, Los derechos que le asisten como titular son: conocer, actualizar, rectificar y suprimir su información personal de nuestras bases de datos, de los cuales podrá conocer su finalidad dentro de nuestra Política de Tratamientos de Datos relacionada en la página web https://mvitales.com/.  Usted podrá hacer valer sus peticiones, quejas o reclamos a través de comunicación escrita al correo: info@mvitales.com, Con la firma de este documento autorizo a la compañía de manera expresa e inequívoca a recolectar, almacenar, usar y tratar los datos que he suministrado.
            </p>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default AvatarPhoto;
