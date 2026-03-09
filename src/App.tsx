import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
import Policy from "./Policy";

function MainApp() {
  // Ya no necesitamos limpiar el archivo de PHP al iniciar
  // useEffect(() => {
  //   fetch("https://proyectoshm.com/marco_pruebas/imagen/clear_image_data_nutricia2.php")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log("Clear WS :", data.message);
  //     })
  //     .catch((error) => console.error("Error limpiando el archivo:", error));
  // }, []);

  // "photo": para mostrar AvatarPhoto.
  // "waiting": para mostrar la pantalla de espera.
  // "result": para mostrar el resultado final.
  // "policy": para mostrar la política de tratamiento de datos.
  const [step, setStep] = useState("photo");
  const [imageUrl, setImageUrl] = useState("");
  const [runId, setRunId] = useState(""); // ID del run de ComfyDeploy
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  const [ciudad, setCiudad] = useState("");
  const [formulario, setFormulario] = useState("");
  const [consentimiento, setConsentimiento] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Estilo seleccionado (realista/caricatura)


  // Esta función se invoca en AvatarPhoto al enviar la petición a ComfyDeploy.
  const handleProcess = (style?: string, newRunId?: string) => {
    if (style) {
      setSelectedStyle(style); // Guardamos el estilo seleccionado
    }
    if (newRunId) {
      setRunId(newRunId); // Guardamos el run ID
    }
    setEmail("");
    setNombre("");
    setCiudad("");
    setFormulario("");
    setConsentimiento("");
    setStep("waiting");
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
    console.log("Consentimiento:", newConsentimiento);
  };



  // Función para pasar a AvatarResult cuando el usuario haga clic en el botón.
  const handleContinue = (mergedUrl: string) => {
    setImageUrl(mergedUrl);
    setStep("result");
  };

  // Ya no necesitamos el polling al endpoint de PHP
  // El polling ahora se maneja directamente en el componente Waiting
  // usando el servicio de ComfyDeploy

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {step === "photo" && (
        <AvatarPhoto
          onProcess={handleProcess}
        />
      )}
      {step === "waiting" && (
        <Waiting
          email={email}
          nombre={nombre}
          formulario={formulario}
          runId={runId} // Pasar el runId en lugar de imagenGenerada
          imageUrl={imageUrl}
          ciudad={ciudad}
          selectedStyle={selectedStyle} // Pasar el estilo seleccionado
          onEmailChange={handleEmailChange}
          onNombreChange={handleNombreChange}
          onCiudadChange={handleCiudadChange}
          onFormularioChange={handleFormularioChange}
          onConsentimientoChange={handleConsentimientoChange}
          onShowPolicy={() => setStep("policy")}
          onContinue={handleContinue} // Función para pasar a AvatarResult
          onImageUrlChange={setImageUrl} // Nueva prop para actualizar la imagen
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
