import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home/Home';
import AvatarPhoto from './components/AvatarAi/AvatarPhoto';
import Waiting from './components/AvatarWait/Waiting';
import AvatarResult from './components/AvatarAi/AvatarResult';
import { initSession, updateSessionPhase } from './services/sessionService';

type Step = 'home' | 'photo' | 'waiting' | 'result';

function MainApp() {
  const [step, setStep] = useState<Step>('home');
  const [runId, setRunId] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');

  useEffect(() => {
    initSession().then(() => updateSessionPhase('home'));
  }, []);

  const handleStart = () => {
    setStep('photo');
    updateSessionPhase('photo');
  };

  const handleBack = () => {
    setStep('home');
    updateSessionPhase('home');
  };

  const handleProcess = (id: string) => {
    setRunId(id);
    setStep('waiting');
    updateSessionPhase('waiting', { runId: id });
  };

  const handleComplete = (imageUrl: string) => {
    setResultImageUrl(imageUrl);
    setStep('result');
    updateSessionPhase('result', { resultStatus: 'success', resultImageUrl: imageUrl });
  };

  const handleReset = () => {
    setRunId('');
    setResultImageUrl('');
    setStep('home');
    updateSessionPhase('home');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {step === 'home' && (
        <Home onStart={handleStart} />
      )}
      {step === 'photo' && (
        <AvatarPhoto
          onProcess={handleProcess}
          onBack={handleBack}
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
