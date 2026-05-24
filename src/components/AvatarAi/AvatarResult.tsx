import React from 'react';
import './AvatarResult.scss';
import oxxoLogo from '../../assets/Oxxo_Logo.svg';

interface AvatarResultProps {
  imageUrl: string;
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({ imageUrl, onReset }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi avatar futbolero OXXO',
          text: '¡Mira mi avatar futbolero creado con IA en OXXO!',
          url: imageUrl,
        });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="result">
      <div className="result__logo-area">
        <img src={oxxoLogo} alt="OXXO" className="result__logo" />
      </div>

      <div className="result__image-wrap">
        <img src={imageUrl} alt="Tu avatar futbolero" className="result__image" />
      </div>

      <div className="result__actions">
        <button className="pill-btn" onClick={handleShare}>
          Compartir en Instagram
        </button>
        <button className="pill-btn pill-btn--outline" onClick={onReset}>
          Crear otro avatar
        </button>
      </div>
    </div>
  );
};

export default AvatarResult;
