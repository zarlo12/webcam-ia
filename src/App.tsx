import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
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
  // "waiting": para mostrar la pantalla de espera.
  // "result": para mostrar el resultado final.
  // "policy": para mostrar la política de tratamiento de datos.
  const [step, setStep] = useState("photo");
  const [imageUrl, setImageUrl] = useState("");
  const [lastImageUrl, setLastImageUrl] = useState("");
  
  // Nuevos campos según especificación
  const [email, setEmail] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [terms, setTerms] = useState<boolean>(false);
  
  const [imagenGenerada, setImagenGenerada] = useState(false); // Nueva bandera
  const [aiImageReady, setAiImageReady] = useState(false); // Estado para imagen de IA lista


  // Esta función se invoca en AvatarPhoto al enviar la petición a n8n.
  // Además, al cambiar a Waiting se limpia los campos para que el usuario los ingrese.
  const handleProcess = () => {

    setNombreEmpresa("");
    setEmail("");
    setCargo("");
    setName("");
    setTelephone("");
    setTerms(false);
    setImagenGenerada(false); // Reiniciamos la bandera al iniciar el proceso
    setAiImageReady(false); // Reiniciamos el estado de imagen IA
    setStep("waiting");
  };





  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
  };



  const handleNameChange = (newName: string) => {
    setName(newName);
  };

  const handleNombreEmpresaChange = (newNombreEmpresa: string) => {
    setNombreEmpresa(newNombreEmpresa);
  };

  const handleCargoChange = (newCargo: string) => {
    setCargo(newCargo);
  };

  const handleTelephoneChange = (newTelephone: string) => {
    setTelephone(newTelephone);
  };

  const handleTermsChange = (newTerms: boolean) => {
    setTerms(newTerms);
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
    console.log('lastImageUrl:', lastImageUrl);

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
          onProcess={handleProcess}
          onAiImageReady={handleAiImageReady}
        />
      )}
      {step === "waiting" && (
        <Waiting
          email={email}
          nombreEmpresa={nombreEmpresa}
          cargo={cargo}
          name={name}
          telephone={telephone}
          terms={terms}
          imagenGenerada={imagenGenerada}
          aiImageReady={aiImageReady}
          imageUrl={imageUrl}
        
      
          onEmailChange={handleEmailChange}
          
          onNameChange={handleNameChange}
          onNombreEmpresaChange={handleNombreEmpresaChange}
          onCargoChange={handleCargoChange} 
          onTelephoneChange={handleTelephoneChange}
          onTermsChange={handleTermsChange}
          onShowPolicy={() => setStep("policy")}
          onContinue={handleContinue}
        />
      )}
      {step === "result" && (
        <AvatarResult
          imageUrl={imageUrl}
          email={email}
          nombreEmpresa={nombreEmpresa}
          cargo={cargo}
          name={name}
          telephone={telephone}
          terms={terms}
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
