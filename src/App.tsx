import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
import Policy from "./Policy";
import { storage, db } from "./firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

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
  const [originalImageUrl, setOriginalImageUrl] = useState(""); // Imagen original capturada
  
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

  // Función helper para convertir URL HTTP a data URL
  const convertUrlToDataUrl = async (url: string): Promise<string> => {
    // Si ya es una data URL, retornarla directamente
    if (url.startsWith('data:')) {
      return url;
    }

    // Si es una URL HTTP, descargarla y convertirla
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error al convertir URL a data URL:", error);
      throw error;
    }
  };

  // Función para manejar cuando la imagen de IA esté lista
  // Ahora también guarda en Firebase antes de mostrar el botón
  const handleAiImageReady = async (generatedImageUrl: string, originalImageDataUrl: string) => {
    try {
      console.log("💾 Iniciando guardado en Firebase...");
      
      setImagenGenerada(true);
      setImageUrl(generatedImageUrl);
      setLastImageUrl(generatedImageUrl);
      setOriginalImageUrl(originalImageDataUrl);

      // Convertir URLs a data URLs si es necesario
      const aiDataUrl = await convertUrlToDataUrl(generatedImageUrl);
      const originalDataUrlConverted = await convertUrlToDataUrl(originalImageDataUrl);

      // Subir imagen generada con IA
      const storageRef = ref(
        storage,
        `CircoTerror2026/${email}-${Date.now()}.png`
      );
      await uploadString(storageRef, aiDataUrl, "data_url");
      const downloadURL = await getDownloadURL(storageRef);

      // Subir imagen original
      const originalStorageRef = ref(
        storage,
        `CircoTerror2026/original-${email}-${Date.now()}.png`
      );
      await uploadString(originalStorageRef, originalDataUrlConverted, "data_url");
      const originalDownloadURL = await getDownloadURL(originalStorageRef);

      // Datos para Firestore con ambas imágenes
      const datosFirestore = {
        email: email,
        name: name,
        nombreEmpresa: nombreEmpresa,
        cargo: cargo,
        telephone: telephone,
        terms: terms,
        imageUrl: downloadURL, // Imagen generada con IA
        imagenOriginal: originalDownloadURL, // Imagen original capturada
        date: new Date(),
      };

      console.log("🚀 ~ datosFirestore:", datosFirestore);

      // Guardar en Firestore
      await addDoc(collection(db, "CircoTerror2026"), datosFirestore);
      
      // Actualizar la URL de la imagen para que AvatarResult use la URL de Firebase
      setImageUrl(downloadURL);
      setLastImageUrl(downloadURL);
      
      console.log("✅ Guardado completo en Firebase");
      
      // AHORA sí mostramos el botón porque TODO está listo
      setAiImageReady(true);
      
    } catch (error) {
      console.error("❌ Error al guardar en Firebase:", error);
      // Aún así mostramos el botón para que el usuario pueda ver su imagen
      setAiImageReady(true);
    }
  };



  // Función para pasar a AvatarResult cuando el usuario haga clic en el botón.
  const handleContinue = () => {
    // imageUrl ya está establecido desde handleAiImageReady
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
          originalImageUrl={originalImageUrl}
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
