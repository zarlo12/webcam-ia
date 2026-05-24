import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import AvatarPhoto from './components/AvatarAi/AvatarPhoto';
import Waiting from './components/AvatarWait/Waiting';
import AvatarResult from './components/AvatarAi/AvatarResult';

type Step = 'home' | 'photo' | 'waiting' | 'result';

function MainApp() {
  const [step, setStep] = useState<Step>('home');
  const [runId, setRunId] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');

  const handleProcess = (id: string) => {
    setRunId(id);
    setStep('waiting');
  };

  const handleComplete = (imageUrl: string) => {
    setResultImageUrl(imageUrl);
    setStep('result');
  };

  const handleReset = () => {
    setRunId('');
    setResultImageUrl('');
    setStep('home');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {step === 'home' && (
        <Home onStart={() => setStep('photo')} />
      )}
      {step === 'photo' && (
        <AvatarPhoto
          onProcess={handleProcess}
          onBack={() => setStep('home')}
        />
      )}
      {step === 'waiting' && (
        <Waiting
          runId={runId}
          onComplete={handleComplete}
        />
      )}
      {step === 'result' && (
        <AvatarResult
          imageUrl={resultImageUrl}
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
