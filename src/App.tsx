import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Swal from "sweetalert2";
import Intro from "./components/Intro/Intro";
import Registro, { RegistroData } from "./components/Registro/Registro";
import Selection from "./components/Selection/Selection";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";

export type StyleChoice = 1 | 2 | 3;
type Step = 'intro' | 'registro' | 'selection' | 'photo' | 'waiting' | 'result';

function MainApp() {
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

  /**
   * La Cloud Function ya guardó la imagen en Firebase Storage y devolvió una URL
   * pública y permanente, así que se usa directamente (antes se volvía a subir
   * desde el navegador a otro proyecto de Firebase).
   */
  const handleAiImageReady = (generatedImageUrl: string) => {
    setImageUrl(generatedImageUrl);
    setImagenGenerada(true);
    setAiImageReady(true);
  };

  const handleGenerationError = (message: string) => {
    setStep('photo');
    setImagenGenerada(false);
    setAiImageReady(false);
    Swal.fire({
      icon: 'error',
      title: 'No pudimos crear tu foto',
      text: message,
      confirmButtonText: 'Intentar de nuevo',
      confirmButtonColor: '#E30613',
    });
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
          registro={registro}
          onProcess={handleProcess}
          onAiImageReady={handleAiImageReady}
          onChangeFilter={() => setStep('selection')}
          onError={handleGenerationError}
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
