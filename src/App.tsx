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
  const [caracteristicas, setCaracteristicas] = useState("");
  const [comprar, setComprar] = useState("");
  const [email, setEmail] = useState("");
  const [marca, setMarca] = useState("");
  const [name, setName] = useState("");
  const [origem, setOrgem] = useState("Feria del Hogar 2025");
  const [rangoEdad, setRangoEdad] = useState("");
  const [renovar, setRenovar] = useState("");
  const [telephone, setTelephone] = useState("");
  const [terms, setTerms] = useState<boolean>(false);
  
  const [imagenGenerada, setImagenGenerada] = useState(false); // Nueva bandera
  const [aiImageReady, setAiImageReady] = useState(false); // Estado para imagen de IA lista


  // Esta función se invoca en AvatarPhoto al enviar la petición a n8n.
  // Además, al cambiar a Waiting se limpia los campos para que el usuario los ingrese.
  const handleProcess = () => {
    setCaracteristicas("");
    setComprar("");
    setEmail("");
    setMarca("");
    setName("");
    setRangoEdad("");
    setRenovar("");
    setTelephone("");
    setTerms(false);
    setImagenGenerada(false); // Reiniciamos la bandera al iniciar el proceso
    setAiImageReady(false); // Reiniciamos el estado de imagen IA
    setStep("waiting");
  };

  // Funciones para actualizar los campos conforme se escriben en Waiting.
  const handleCaracteristicasChange = (newCaracteristicas: string) => {
    setCaracteristicas(newCaracteristicas);
  };

  const handleComprarChange = (newComprar: string) => {
    setComprar(newComprar);
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
  };

  const handleMarcaChange = (newMarca: string) => {
    setMarca(newMarca);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
  };

  const handleRangoEdadChange = (newRangoEdad: string) => {
    setRangoEdad(newRangoEdad);
  };

  const handleRenovarChange = (newRenovar: string) => {
    setRenovar(newRenovar);
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
          caracteristicas={caracteristicas}
          comprar={comprar}
          email={email}
          marca={marca}
          name={name}
          origem={origem}
          rangoEdad={rangoEdad}
          renovar={renovar}
          telephone={telephone}
          terms={terms}
          imagenGenerada={imagenGenerada}
          aiImageReady={aiImageReady}
          imageUrl={imageUrl}
          onCaracteristicasChange={handleCaracteristicasChange}
          onComprarChange={handleComprarChange}
          onEmailChange={handleEmailChange}
          onMarcaChange={handleMarcaChange}
          onNameChange={handleNameChange}
          onRangoEdadChange={handleRangoEdadChange}
          onRenovarChange={handleRenovarChange}
          onTelephoneChange={handleTelephoneChange}
          onTermsChange={handleTermsChange}
          onShowPolicy={() => setStep("policy")}
          onContinue={handleContinue}
        />
      )}
      {step === "result" && (
        <AvatarResult
          imageUrl={imageUrl}
          caracteristicas={caracteristicas}
          comprar={comprar}
          email={email}
          marca={marca}
          name={name}
          origem={origem}
          rangoEdad={rangoEdad}
          renovar={renovar}
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
