import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Intro from "./components/Intro/Intro";
import Registro, { RegistroData } from "./components/Registro/Registro";
import Selection from "./components/Selection/Selection";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
import { storage } from "./firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export type StyleChoice = 1 | 2 | 3;
type Step = 'intro' | 'registro' | 'selection' | 'photo' | 'waiting' | 'result';

function MainApp() {
  useEffect(() => {
    fetch("https://proyectoshm.com/marco_pruebas/imagen/clear_image_data.php")
      .then(r => r.json())
      .then(data => console.log("Clear WS:", data.message))
      .catch(err => console.error("Error limpiando:", err));
  }, []);

  const [step, setStep] = useState<Step>('intro');
  const [registro, setRegistro] = useState<RegistroData | null>(null);
  const [styleChoice, setStyleChoice] = useState<StyleChoice>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [imagenGenerada, setImagenGenerada] = useState(false);
  const [aiImageReady, setAiImageReady] = useState(false);

  const handleRegistro = (data: RegistroData) => {
    setRegistro(data);
    setStep('selection');
  };

  const handleProcess = () => {
    setImagenGenerada(false);
    setAiImageReady(false);
    setStep('waiting');
  };

  const convertUrlToDataUrl = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) return url;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAiImageReady = async (generatedImageUrl: string, _originalImageDataUrl: string) => {
    try {
      setImagenGenerada(true);
      setImageUrl(generatedImageUrl);

      const aiDataUrl = await convertUrlToDataUrl(generatedImageUrl);
      const storageRef = ref(storage, `Antioquia/${Date.now()}.png`);
      await uploadString(storageRef, aiDataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      setImageUrl(downloadURL);
      setAiImageReady(true);
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      setAiImageReady(true);
    }
  };

  const handleReset = () => {
    setRegistro(null);
    setStyleChoice(1);
    setImageUrl('');
    setImagenGenerada(false);
    setAiImageReady(false);
    setStep('intro');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {step === 'intro' && (
        <Intro onStart={() => setStep('registro')} />
      )}
      {step === 'registro' && (
        <Registro onSubmit={handleRegistro} />
      )}
      {step === 'selection' && (
        <Selection
          styleChoice={styleChoice}
          onStyleChoiceChange={setStyleChoice}
          onNext={() => setStep('photo')}
        />
      )}
      {step === 'photo' && (
        <AvatarPhoto
          styleChoice={styleChoice}
          userId={registro?.cedula}
          onProcess={handleProcess}
          onAiImageReady={handleAiImageReady}
          onChangeFilter={() => setStep('selection')}
        />
      )}
      {step === 'waiting' && (
        <Waiting
          imagenGenerada={imagenGenerada}
          aiImageReady={aiImageReady}
          onContinue={() => setStep('result')}
        />
      )}
      {step === 'result' && (
        <AvatarResult
          imageUrl={imageUrl}
          originalImageUrl=""
          onReset={handleReset}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
    </Routes>
  );
}

export default App;
