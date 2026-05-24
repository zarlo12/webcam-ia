import React, { useState, useRef } from 'react';
import './AvatarPhoto.scss';
import oxxoLogo from '../../assets/Oxxo_Logo.svg';
import WebcamScene from '../WebcamScene';
import Swal from 'sweetalert2';
import { storage } from '../../firebaseConfig';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { queueImageProcessingCabezoxxoz } from '../../services/comfyDeployService';

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

interface AvatarPhotoProps {
  onProcess: (runId: string) => void;
  onBack: () => void;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess, onBack }) => {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const webcamRef = useRef<WebcamRef | null>(null);

  const handleCapture = async () => {
    if (!webcamRef.current?.captureImage) return;
    try {
      const blob = await webcamRef.current.captureImage();
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo capturar la foto. Inténtalo de nuevo.' });
    }
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedUrl('');
  };

  const handleConfirm = async () => {
    if (!capturedBlob || isProcessing) return;
    setIsProcessing(true);

    try {
      // Upload original to Firebase Storage
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedBlob);
      });

      const storageRef = ref(storage, `Cabezoxxoz_originals/${Date.now()}.jpg`);
      await uploadString(storageRef, dataUrl, 'data_url');
      await getDownloadURL(storageRef);

      // Queue on ComfyDeploy
      const response = await queueImageProcessingCabezoxxoz(capturedBlob);
      onProcess(response.run_id);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      setIsProcessing(false);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar la imagen. Inténtalo de nuevo.' });
    }
  };

  return (
    <div className="camera">
      {/* Top bar */}
      <div className="camera__topbar">
        <button className="camera__back" onClick={onBack} aria-label="Volver">‹</button>
        <img src={oxxoLogo} alt="OXXO" className="camera__logo" />
        <div className="camera__spacer" />
      </div>

      {/* Instruction */}
      <p className="camera__instruction">
        {capturedUrl ? '¡Foto lista! ¿La usamos?' : 'Colócate dentro del marco'}
      </p>

      {/* Camera frame */}
      <div className="camera__frame-wrap">
        <div className="camera__frame">
          {capturedUrl ? (
            <img src={capturedUrl} alt="Foto capturada" className="camera__captured" />
          ) : (
            <>
              <div className="camera__webcam">
                <WebcamScene ref={webcamRef} />
              </div>
              <div className="camera__silhouette">👤</div>
            </>
          )}

          {/* Corner markers */}
          <div className="camera__corner camera__corner--tl" />
          <div className="camera__corner camera__corner--tr" />
          <div className="camera__corner camera__corner--bl" />
          <div className="camera__corner camera__corner--br" />
        </div>
      </div>

      {/* Actions */}
      <div className="camera__actions">
        {capturedUrl ? (
          <div className="camera__btn-stack">
            <button className="pill-btn" onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Creando avatar...' : '¡Crear mi avatar! 🚀'}
            </button>
            <button className="pill-btn pill-btn--outline" onClick={handleRetake} disabled={isProcessing}>
              Tomar otra foto
            </button>
          </div>
        ) : (
          <button className="camera__capture-btn" onClick={handleCapture} aria-label="Capturar foto" />
        )}
      </div>
    </div>
  );
};

export default AvatarPhoto;
