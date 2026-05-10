import React, { useState, useEffect } from "react";
import "./Waiting.scss";

interface WaitingProps {
  imagenGenerada: boolean;
  aiImageReady: boolean;
  onContinue: () => void;
}

const loadingTitles = [
  "CREANDO TU RECUERDO",
  "PINTANDO LAS FLORES",
  "CAPTURANDO EL AMOR",
  "CASI LISTA TU FOTO",
  "UN MOMENTO MÁS",
  "FINALIZANDO CON AMOR",
];

const loadingEmojis = ["🌸", "💐", "🌺", "💝", "✨", "🎀"];

const Waiting: React.FC<WaitingProps> = ({ aiImageReady, onContinue }) => {
  const [currentTitle, setCurrentTitle] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    if (aiImageReady) return;
    const interval = setInterval(() => {
      setCurrentTitle(prev => (prev + 1) % loadingTitles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [aiImageReady]);

  useEffect(() => {
    if (aiImageReady) return;
    const interval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % loadingEmojis.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [aiImageReady]);

  return (
    <div className="waiting-fullscreen">
      <button onClick={toggleFullscreen} className="waiting-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="waiting-card-show">
        {!aiImageReady && (
          <div className="creation-show">
            <div className="waiting-date-tag">🌸 10 DE MAYO 🌸</div>
            <h1 className="show-title">{loadingTitles[currentTitle]}</h1>
            <div className="epic-spinner-container">
              <div className="spinner-ring ring-1" />
              <div className="spinner-ring ring-2" />
              <div className="spinner-ring ring-3" />
              <p className="loading-message">{loadingEmojis[currentEmoji]}</p>
            </div>
            <p className="waiting-hint">Estamos creando algo hermoso para ti</p>
          </div>
        )}

        {aiImageReady && (
          <div className="ready-show">
            <div className="success-icon-container">
              <div className="success-icon">💐</div>
            </div>
            <h2 className="ready-title">¡Lista con amor!</h2>
            <button type="button" className="button-epic-reveal" onClick={onContinue}>
              <span className="button-epic-text">VER NUESTRA FOTO 🌸</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;
