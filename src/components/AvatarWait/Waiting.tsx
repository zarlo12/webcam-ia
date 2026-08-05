import React, { useState, useEffect } from "react";
import "./Waiting.scss";
import fondo from "../../assets/claro/fondo.jpeg";
import useFullscreen from "../../hooks/useFullscreen";

interface WaitingProps {
  imagenGenerada: boolean;
  aiImageReady: boolean;
  onContinue: () => void;
}

const loadingTitles = [
  "CREANDO TU FOTO",
  "SEMBRANDO LAS FLORES",
  "ARMANDO LA SILLETA",
  "PINTANDO ANTIOQUIA",
  "UN MOMENTO MÁS",
  "YA CASI LLEGAMOS LEJOS",
];

const loadingEmojis = ["🌺", "💐", "🌻", "🌼", "✨", "🌸"];

const Waiting: React.FC<WaitingProps> = ({ aiImageReady, onContinue }) => {
  const [currentTitle, setCurrentTitle] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

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
      <div className="waiting-bg" style={{ backgroundImage: `url(${fondo})` }} />
      <div className="waiting-veil" aria-hidden="true" />

      <button onClick={toggleFullscreen} className="waiting-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="waiting-card-show">
        {!aiImageReady && (
          <div className="creation-show">
            <div className="waiting-date-tag">ANTIOQUIA NOS ENSEÑA A LLEGAR LEJOS</div>
            <h1 className="show-title">{loadingTitles[currentTitle]}</h1>
            <div className="epic-spinner-container">
              <div className="spinner-ring ring-1" />
              <div className="spinner-ring ring-2" />
              <div className="spinner-ring ring-3" />
              <p className="loading-message">{loadingEmojis[currentEmoji]}</p>
            </div>
            <p className="waiting-hint">Estamos creando tu foto de la Feria</p>
          </div>
        )}

        {aiImageReady && (
          <div className="ready-show">
            <div className="success-icon-container">
              <div className="success-icon">💐</div>
            </div>
            <h2 className="ready-title">¡Tu foto está lista!</h2>
            <button type="button" className="button-epic-reveal" onClick={onContinue}>
              <span className="button-epic-text">VER MI FOTO</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;
