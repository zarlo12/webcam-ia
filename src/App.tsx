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
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [celular, setCelular] = useState("");
  const [consentimiento, setConsentimiento] = useState("");
  const [imagenGenerada, setImagenGenerada] = useState(false); // Nueva bandera
  const [tipoSuenio, setTipoSuenio] = useState("");

  // Esta función se invoca en AvatarPhoto al enviar la petición a n8n.
  // Además, al cambiar a Waiting se limpia el email para que el usuario lo ingrese nuevamente.
  const handleProcess = () => {
    setEmail("");
    setNombre("");
    setCedula("");
    setCelular("");
    setConsentimiento("");
    setImagenGenerada(false); // Reiniciamos la bandera al iniciar el proceso
    setStep("waiting");
  };

  // Función para actualizar el email conforme se escribe en Waiting.
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
  };

  const handleNombreChange = (newNombre: string) => {
    setNombre(newNombre);
  };
  const handleCedulaChange = (newCedula: string) => {
    setCedula(newCedula);
  };

  const handleCelularChange = (newCelular: string) => {
    setCelular(newCelular);
  };
  const handleConsentimientoChange = (newConsentimiento: string) => {
    setConsentimiento(newConsentimiento);
    console.log("Consentimiento:", newConsentimiento);
  };

  // Callback para recibir la selección de "sueño" desde AvatarPhoto
  const handleDreamChange = (dream: string) => {
    setTipoSuenio(dream);
    console.log("Tipo de sueño seleccionado:", dream);
  };

  // Función para pasar a AvatarResult cuando el usuario haga clic en el botón.
  const handleContinue = (mergedUrl: string) => {
    setImageUrl(mergedUrl);
    setStep("result");
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    // Solo en el paso "waiting" se hace polling a la API de PHP.
    if (step === "waiting") {
      interval = setInterval(async () => {
        try {
          const response = await fetch(
            "https://proyectoshm.com/marco_pruebas/imagen/callback.php"
          );
          const data = await response.json();
          // Si existe una imagen nueva, se actualiza el estado y se guarda en Firestore.
          if (
            data.img_url &&
            data.img_url !== "" &&
            data.img_url !== lastImageUrl
          ) {
            setLastImageUrl(data.img_url);
            setImageUrl(data.img_url);
            setImagenGenerada(true); // Establecemos la bandera en true
          }
        } catch (error) {
          console.error("Error al obtener la imagen:", error);
        }
      }, 7000); // Consulta cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, lastImageUrl, email, nombre, cedula, celular, consentimiento]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {step === "photo" && (
        <AvatarPhoto
          onProcess={handleProcess}
          onDreamChange={handleDreamChange}
        />
      )}
      {step === "waiting" && (
        <Waiting
          email={email}
          nombre={nombre}
          cedula={cedula}
          celular={celular}
          imagenGenerada={imagenGenerada} // Prop bandera
          imageUrl={imageUrl}
          tipoSuenio={tipoSuenio}
          onEmailChange={handleEmailChange}
          onNombreChange={handleNombreChange}
          onCedulaChange={handleCedulaChange}
          onCelularChange={handleCelularChange}
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
          cedula={cedula}
          profesion={tipoSuenio}
          celular={celular}
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
