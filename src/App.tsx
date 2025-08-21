import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
import QuestionForm from "./components/QuestionForm/QuestionForm";
import Policy from "./Policy";

function MainApp() {
  useEffect(() => {
    fetch("https://proyectoshm.com/marco_pruebas/imagen/clear_image_data.php")
      .then((response) => response.json())
      .then((data) => {
        console.log("Clear WS :", data.message);
      })
      .catch((error) => console.error("Error limpiando el archivo:", error));
  }, []);

  // "photo": para mostrar AvatarPhoto.
  // "questions": para mostrar el formulario de preguntas.
  // "waiting": para mostrar la pantalla de espera.
  // "result": para mostrar el resultado final.
  // "policy": para mostrar la política de tratamiento de datos.
  const [step, setStep] = useState("photo");
  const [imageUrl, setImageUrl] = useState("");
  const [lastImageUrl, setLastImageUrl] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  const [ciudad, setCiudad] = useState("");
  const [formulario, setFormulario] = useState("");
  const [consentimiento, setConsentimiento] = useState("");
  const [imagenGenerada, setImagenGenerada] = useState(false); // Nueva bandera
  const [aiImageReady, setAiImageReady] = useState(false); // Estado para imagen de IA lista
  
  // Nuevos estados para el sistema de preguntas
  const [selectedService, setSelectedService] = useState("");
  const [accessories, setAccessories] = useState<string[]>([]);
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);


  // Esta función se invoca en AvatarPhoto cuando se captura la imagen
  // Ahora redirige al formulario de preguntas en lugar de directamente a waiting
  const handlePhotoCapture = (imageBlob: Blob) => {
    setCapturedImageBlob(imageBlob);
    setStep("questions");
  };

  // Función que se ejecuta cuando se completa el formulario de preguntas
  const handleQuestionFormComplete = (service: string, serviceAccessories: string[]) => {
    setSelectedService(service);
    setAccessories(serviceAccessories);
    
    console.log("✅ Preguntas completadas:", { service, serviceAccessories });
    
    // Inmediatamente procesar la imagen con los accesorios seleccionados
    handleProcessImageWithAccessories(service, serviceAccessories);
  };

  // Función para procesar la imagen con los accesorios basados en las respuestas
  const handleProcessImageWithAccessories = async (service: string, serviceAccessories: string[]) => {
    if (!capturedImageBlob) return;

    setEmail("");
    setNombre("");
    setCiudad("");
    setFormulario("");
    setConsentimiento("");
    setImagenGenerada(false);
    setAiImageReady(false);
    setStep("waiting");

    try {
      console.log("🎯 Procesando imagen con accesorios para:", service);
      
      // Crear el prompt dinámico basado en los accesorios seleccionados
      const accessoriesText = serviceAccessories.map((acc, index) => 
        `${index + 1}) ${acc.toLowerCase()}`
      ).join('; ');

      // Definir el tipo de ropa basado en el servicio seleccionado
      const getClothingStyle = (service: string) => {
        const clothingMap: { [key: string]: string } = {
          "15 minutos": "trendy fashion clothing",
          "reaserch": "ropa formal dependiendo y acorde al genero de la foto",
          "plaza claro": "casual shopping attire",
          "Un café claro": "smart casual clothing",
          "Salud 1010": "athletic clothing",
          "Claro Musica": "urban street clothing",
          "portal redmas.com.co": "professional business clothing",
          "mobile marketing": "modern tech-savvy clothing",
          "radiola tv": "traditional folk clothing",
          "Sin Limites tv": "rock/music fan clothing"
        };
        return clothingMap[service] || "casual clothing";
      };

      const clothingStyle = getClothingStyle(service);

      const dynamicPrompt = `NO TEXT, FUNKO-STYLE TOY ILLUSTRATION ONLY - NOT REALISTIC: SINGLE TOY BOX ONLY. A Funko Pop–style doll placed inside the SAME toy box, positioned on the LEFT side of the box interior. 

CRITICAL INSTRUCTIONS:
1. ANALYZE THE INPUT PHOTO CAREFULLY: Match the person's skin tone, complexion, hair color, and general appearance from the uploaded image
2. MAINTAIN EXACT FUNKO PROPORTIONS: Oversized round head (must be 2x larger than body), tiny rectangular body, large round black eyes, minimal facial features, no realistic details
3. CLOTHING ADAPTATION: The doll is wearing ${clothingStyle} - adapt the clothing style to match the gender shown in the input photo (if woman then feminine clothing, if man then masculine clothing)

MANDATORY REQUIREMENTS:
- Copy the person's skin color and complexion exactly from the input image
- Keep the signature Funko Pop head shape: round, oversized, simple
- Large black dot eyes typical of Funko figures
- Minimal nose and mouth details
- Match hair color and general hairstyle from the photo but in simplified Funko style
- Body must be much smaller than the head
- Pose energetic and confident

Do not change any accessories. On the RIGHT side, INSIDE THE SAME BOX, arrange the original accessories: ${accessoriesText}. Strict composition: doll left, accessories grouped right, all within one box with a single clear display window. Art style: 2D cel-shaded, clean vector-like lines, packaging art, warm pastel palette, flat soft shadows. Company color treatment: primary box surface deep black (#000000), with accent cintillos/straps, thin border lines, and small geometric accents in vivid red (example hex #C8102E) — use red only as decorative accents (ribbons, tape, window border, small corner stripe). BACKGROUND: solid dark gray color #262626, completely uniform, no patterns, no gradients, no textures. IMPORTANT: NO TEXT, NO LOGOS, NO NUMBERS anywhere on the box, window, stickers, price tags, or background. Absolutely no words or typography. NOT a photo, NO realistic skin texture, NO photographic lighting.`;

      console.log("📝 Prompt dinámico:", dynamicPrompt);
      console.log("🎯 Servicio seleccionado:", selectedService);
      console.log("🎒 Accesorios:", accessories);
      
      // Importar el servicio de IA
      const { default: aiImageService } = await import("./services/aiImageService");
      
      // Procesar la imagen con el prompt personalizado
      const result = await aiImageService.generateImageWithFormData(
        capturedImageBlob,
        dynamicPrompt,
        '',
        "user-" + Date.now()
      );

      if (result.success && result.imageUrl) {
        console.log("✅ Imagen generada exitosamente:", result.imageUrl);
        handleAiImageReady(result.imageUrl);
      } else {
        console.error("❌ Error al generar imagen:", result.error);
      }

    } catch (error) {
      console.error("💥 Error al procesar la imagen:", error);
    }
  };

  // Función para actualizar el email conforme se escribe en Waiting.
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
  };

  const handleNombreChange = (newNombre: string) => {
    setNombre(newNombre);
  };

  const handleCiudadChange = (newCiudad: string) => {
    setCiudad(newCiudad);
  };

  const handleFormularioChange = (newFormulario: string) => {
    setFormulario(newFormulario);
  };
 
  const handleConsentimientoChange = (newConsentimiento: string) => {
    setConsentimiento(newConsentimiento);
    console.log("Consentimiento:", lastImageUrl);
  };

  // Función para manejar cuando la imagen de IA esté lista
  const handleAiImageReady = (generatedImageUrl: string) => {
    setAiImageReady(true);
    setImagenGenerada(true);
    setImageUrl(generatedImageUrl); // Establecer la URL de la imagen generada
    setLastImageUrl(generatedImageUrl);
  };



  // Función para pasar a AvatarResult cuando el usuario haga clic en el botón.
  const handleContinue = (mergedUrl: string) => {
    setImageUrl(mergedUrl);
    setLastImageUrl(mergedUrl); // Actualizar también el lastImageUrl
    setStep("result");
  };

  useEffect(() => {
    // Ya no necesitamos polling porque la imagen viene directamente del servicio de IA
    // El useEffect anterior que hacía polling a PHP ha sido eliminado
    // porque ahora usamos Replicate directamente
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {step === "photo" && (
        <AvatarPhoto
          onProcess={handlePhotoCapture}
          onAiImageReady={handleAiImageReady}
          capturedImageBlob={capturedImageBlob}
        />
      )}
      {step === "questions" && (
        <QuestionForm
          onComplete={handleQuestionFormComplete}
        />
      )}
      {step === "waiting" && (
        <Waiting
          email={email}
          nombre={nombre}
          formulario={formulario}
          imagenGenerada={imagenGenerada} // Prop bandera
          aiImageReady={aiImageReady} // Nueva prop para imagen de IA lista
          imageUrl={imageUrl}
          ciudad={ciudad}
          selectedService={selectedService} // Pasamos el servicio seleccionado
          onEmailChange={handleEmailChange}
          onNombreChange={handleNombreChange}
          onCiudadChange={handleCiudadChange}
          onFormularioChange={handleFormularioChange}
          onConsentimientoChange={handleConsentimientoChange}
          onShowPolicy={() => setStep("policy")}
          onContinue={handleContinue} // Función para pasar a AvatarResult
        />
      )}
      {step === "result" && (
        <AvatarResult
          imageUrl={imageUrl}
          email={email}
          nombre={nombre}
          ciudad={ciudad}
          formulario={formulario}
          consentimiento={consentimiento}
          selectedService={selectedService}
          onReset={() => setStep("photo")}
        />
      )}
      {step === "policy" && <Policy onBack={() => setStep("waiting")} />}
    </div>
  );
}

// Componente principal que define las rutas
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
    </Routes>
  );
}

export default App;
