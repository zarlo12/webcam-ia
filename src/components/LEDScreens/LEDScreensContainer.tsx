import React, { useEffect } from 'react';
import LEDScreen from './LEDScreen';
import ledScreenService from '../../services/ledScreenService';
import './LEDScreensContainer.scss';

const LEDScreensContainer: React.FC = () => {
  useEffect(() => {
    // Iniciar el sistema de rotación automática
    ledScreenService.startRotationSystem();
    console.log('🎬 Sistema de pantallas LED iniciado');
  }, []);

  return (
    <div className="led-screens-container">
      <div className="screens-grid">
        <div className="screen-wrapper">
          <LEDScreen screenNumber={1} title="Pantalla 1" />
        </div>
        <div className="screen-wrapper">
          <LEDScreen screenNumber={2} title="Pantalla 2" />
        </div>
        <div className="screen-wrapper">
          <LEDScreen screenNumber={3} title="Pantalla 3" />
        </div>
      </div>
    </div>
  );
};

export default LEDScreensContainer;
