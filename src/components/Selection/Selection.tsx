import React, { useState } from 'react';
import './Selection.scss';
import { StyleChoice } from '../../App';

interface SelectionProps {
  styleChoice: StyleChoice;
  onStyleChoiceChange: (v: StyleChoice) => void;
  onNext: () => void;
}

const STYLE_OPTIONS: { id: StyleChoice; label: string; preview: string }[] = [
  { id: 1, label: 'Acuarela', preview: '/ejemplos/ejemplo1.jpeg' },
  { id: 2, label: '3D Animado', preview: '/ejemplos/ejemplo2.jpeg' },
  { id: 3, label: 'Vintage', preview: '/ejemplos/ejemplo3.jpeg' },
];

const Selection: React.FC<SelectionProps> = ({ styleChoice, onStyleChoiceChange, onNext }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const current = STYLE_OPTIONS[styleChoice - 1];

  const goNext = () => onStyleChoiceChange((styleChoice === 3 ? 1 : styleChoice + 1) as StyleChoice);
  const goPrev = () => onStyleChoiceChange((styleChoice === 1 ? 3 : styleChoice - 1) as StyleChoice);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="sel-container">
      <button onClick={toggleFullscreen} className="sel-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="sel-petals" aria-hidden="true">
        <span className="sel-petal sel-petal-1">🌸</span>
        <span className="sel-petal sel-petal-2">🌺</span>
        <span className="sel-petal sel-petal-3">🌷</span>
        <span className="sel-petal sel-petal-4">🌸</span>
      </div>

      <div className="sel-header">
        <div className="sel-date-tag">🌸 10 DE MAYO 🌸</div>
        <h1 className="sel-title">Día de las <span>Madres</span></h1>
        <p className="sel-subtitle">desliza y elige el estilo de tu foto</p>
      </div>

      <div className="sel-slider">
        <button className="sel-arrow sel-arrow--prev" onClick={goPrev} aria-label="Anterior">
          ‹
        </button>

        <div className="sel-slide-area">
          <img
            key={styleChoice}
            src={current.preview}
            alt={current.label}
            className="sel-slide-img"
          />
        </div>

        <button className="sel-arrow sel-arrow--next" onClick={goNext} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className="sel-info">
        <div className="sel-dots">
          {STYLE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`sel-dot${styleChoice === opt.id ? ' sel-dot--active' : ''}`}
              onClick={() => onStyleChoiceChange(opt.id)}
              aria-label={opt.label}
            />
          ))}
        </div>
        <h2 className="sel-style-name" key={`name-${styleChoice}`}>{current.label}</h2>
      </div>

      <div className="sel-cta">
        <button className="sel-submit-btn" onClick={onNext}>
          ELEGIR ESTE ESTILO 📸
        </button>
      </div>

      <div className="sel-footer">
        <span>💐 con amor · 10 de mayo 💐</span>
      </div>
    </div>
  );
};

export default Selection;
