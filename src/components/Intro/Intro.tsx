import React from 'react';
import './Intro.scss';
import fondo from '../../assets/claro/fondo.jpeg';
import useFullscreen from '../../hooks/useFullscreen';

interface IntroProps {
  onStart: () => void;
}

/** Pantalla 1: arte completo de campaña. Un toque en cualquier parte avanza al registro. */
const Intro: React.FC<IntroProps> = ({ onStart }) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div
      className="intro-screen"
      onClick={onStart}
      role="button"
      tabIndex={0}
      aria-label="Comenzar"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onStart();
      }}
    >
      <div className="intro-bg" style={{ backgroundImage: `url(${fondo})` }} />

      {/* Resalte suave sobre el botón "Comenzar" que ya viene en el arte */}
      <div className="intro-cta-glow" aria-hidden="true" />

      <button
        onClick={e => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className="intro-fullscreen-btn"
        title="Pantalla completa"
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
    </div>
  );
};

export default Intro;
