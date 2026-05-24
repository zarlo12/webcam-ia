import React, { useEffect, useRef } from 'react';
import './Waiting.scss';
import oxxoLogo from '../../assets/Oxxo_Logo.svg';
import Swal from 'sweetalert2';
import {
  getRunStatusCabezoxxoz,
  extractGeneratedImageUrl,
  extractErrorMessage,
} from '../../services/comfyDeployService';
import { updateSessionPhase } from '../../services/sessionService';

interface WaitingProps {
  runId: string;
  onComplete: (imageUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({ runId, onComplete }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!runId) return;

    const check = async () => {
      try {
        const status = await getRunStatusCabezoxxoz(runId);

        if (status.status === 'success') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const imageUrl = extractGeneratedImageUrl(status);
          if (imageUrl) onComplete(imageUrl);
        } else if (status.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const msg = extractErrorMessage(status) ?? 'Hubo un error procesando tu imagen.';
          updateSessionPhase('failed', { resultStatus: 'failed', failureReason: msg });
          await Swal.fire({
            icon: 'error',
            title: '¡Oops! Algo salió mal',
            text: msg + ' Por favor, toma una nueva foto.',
            confirmButtonText: 'Tomar nueva foto',
            confirmButtonColor: '#EE1C25',
            allowOutsideClick: false,
          });
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Error checking run status:', err);
      }
    };

    check();
    intervalRef.current = setInterval(check, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runId, onComplete]);

  return (
    <div className="waiting">
      <img src={oxxoLogo} alt="OXXO" className="waiting__logo" />

      <div className="waiting__body">
        <div className="waiting__spinner" />
        <h2 className="waiting__title">Creando tu avatar...</h2>
        <p className="waiting__subtitle">Esto tardará unos segundos</p>
      </div>

      <img src={oxxoLogo} alt="OXXO" className="waiting__logo-bottom" />
    </div>
  );
};

export default Waiting;
