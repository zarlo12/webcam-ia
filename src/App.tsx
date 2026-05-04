import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Selection from "./components/Selection/Selection";
import AvatarPhoto from "./components/AvatarAi/AvatarPhoto";
import AvatarResult from "./components/AvatarAi/AvatarResult";
import Waiting from "./components/AvatarWait/Waiting";
import Policy from "./Policy";
import { storage, db } from "./firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

type Gender = 'hombre' | 'mujer';
type CharacterStyle = 'guerrero' | 'cyberpunk';
type Step = 'selection' | 'photo' | 'waiting' | 'result' | 'policy';

function MainApp() {
  useEffect(() => {
    fetch("https://proyectoshm.com/marco_pruebas/imagen/clear_image_data.php")
      .then(r => r.json())
      .then(data => console.log("Clear WS:", data.message))
      .catch(err => console.error("Error limpiando:", err));
  }, []);

  const [step, setStep] = useState<Step>('selection');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [terms, setTerms] = useState(false);
  const [gender, setGender] = useState<Gender>('hombre');
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>('guerrero');
  const [imageUrl, setImageUrl] = useState('');
  const [, setLastImageUrl] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [imagenGenerada, setImagenGenerada] = useState(false);
  const [aiImageReady, setAiImageReady] = useState(false);

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

  const handleAiImageReady = async (generatedImageUrl: string, originalImageDataUrl: string) => {
    try {
      setImagenGenerada(true);
      setImageUrl(generatedImageUrl);
      setLastImageUrl(generatedImageUrl);
      setOriginalImageUrl(originalImageDataUrl);

      const aiDataUrl = await convertUrlToDataUrl(generatedImageUrl);
      const originalConverted = await convertUrlToDataUrl(originalImageDataUrl);

      const storageRef = ref(storage, `DesbloqueatuPoder/${email}-${Date.now()}.png`);
      await uploadString(storageRef, aiDataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      const originalRef = ref(storage, `DesbloqueatuPoder/original-${email}-${Date.now()}.png`);
      await uploadString(originalRef, originalConverted, 'data_url');

      await addDoc(collection(db, 'DesbloqueatuPoder'), {
        nombre,
        apellidos,
        email,
        direccion,
        terms,
        gender,
        characterStyle,
        imageUrl: downloadURL,
        imagenOriginal: await getDownloadURL(originalRef),
        date: new Date(),
      });

      setImageUrl(downloadURL);
      setLastImageUrl(downloadURL);
      setAiImageReady(true);
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      setAiImageReady(true);
    }
  };

  const handleReset = () => {
    setNombre('');
    setApellidos('');
    setEmail('');
    setDireccion('');
    setTerms(false);
    setGender('hombre');
    setCharacterStyle('guerrero');
    setImageUrl('');
    setLastImageUrl('');
    setOriginalImageUrl('');
    setImagenGenerada(false);
    setAiImageReady(false);
    setStep('selection');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {step === 'selection' && (
        <Selection
          nombre={nombre}
          apellidos={apellidos}
          email={email}
          direccion={direccion}
          terms={terms}
          gender={gender}
          characterStyle={characterStyle}
          onNombreChange={setNombre}
          onApellidosChange={setApellidos}
          onEmailChange={setEmail}
          onDireccionChange={setDireccion}
          onTermsChange={setTerms}
          onGenderChange={setGender}
          onStyleChange={setCharacterStyle}
          onShowPolicy={() => setStep('policy')}
          onNext={() => setStep('photo')}
        />
      )}
      {step === 'photo' && (
        <AvatarPhoto
          gender={gender}
          characterStyle={characterStyle}
          onProcess={handleProcess}
          onAiImageReady={handleAiImageReady}
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
          originalImageUrl={originalImageUrl}
          onReset={handleReset}
        />
      )}
      {step === 'policy' && <Policy onBack={() => setStep('selection')} />}
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
