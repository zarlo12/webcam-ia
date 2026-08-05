import React, { useState } from 'react';
import './Selection.scss';
import { StyleChoice } from '../../App';
import { FILTERS } from '../../filters';
import fondo from '../../assets/claro/fondo.jpeg';
import useFullscreen from '../../hooks/useFullscreen';

interface SelectionProps {
  styleChoice: StyleChoice;
  onStyleChoiceChange: (v: StyleChoice) => void;
  onNext: () => void;
}

/** Pantalla 3: selección de filtro. Al tocar una tarjeta se avanza a la cámara. */
const Selection: React.FC<SelectionProps> = ({ styleChoice, onStyleChoiceChange, onNext }) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [locked, setLocked] = useState(false);

  const handlePick = (id: StyleChoice) => {
    if (locked) return;
    setLocked(true);
    onStyleChoiceChange(id);
    // pequeña pausa para que se vea la tarjeta seleccionada antes de avanzar
    window.setTimeout(onNext, 260);
  };

  return (
    <div className="sel-screen">
      <div className="sel-bg" style={{ backgroundImage: `url(${fondo})` }} />
      <div className="sel-veil" aria-hidden="true" />

      <button onClick={toggleFullscreen} className="sel-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="sel-row">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type="button"
            className={`sel-card${styleChoice === filter.id && locked ? ' sel-card--active' : ''}`}
            onClick={() => handlePick(filter.id)}
            aria-label={`Elegir ${filter.label}`}
          >
            <span className="sel-card-label">{filter.label}</span>
            <span className="sel-card-media">
              <img src={filter.preview} alt={filter.label} className="sel-card-img" />
            </span>
          </button>
        ))}
      </div>

      <h2 className="sel-heading">
        <span>Selecciona el filtro</span>
        <span>que más te guste</span>
      </h2>
    </div>
  );
};

export default Selection;
