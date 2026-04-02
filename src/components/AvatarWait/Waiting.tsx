import React, { useState, useRef, useEffect } from "react";
import "./Waiting.scss";

import MergeImage from "../AvatarAi/MergeImage"; // Asegúrate de la ruta correcta

declare global {
  interface Window {
    Tally?: {
      openPopup: (
        formId: string,
        options?: {
          key?: string;
          layout?: string;
          width?: number;
          height?: number;
          overlay?: boolean;
          emojiText?: string;
          emojiAnimation?: string;
        }
      ) => void;
    };
  }
}

interface WaitingProps {
  email: string;
  name: string;
  telephone: string;
  nombreEmpresa: string;
  cargo: string;
  terms: boolean;
  imagenGenerada: boolean;
  aiImageReady: boolean;
  imageUrl: string;
  
  onEmailChange: (email: string) => void;

  onNameChange: (name: string) => void;

  onTelephoneChange: (telephone: string) => void;
  onNombreEmpresaChange: (nombreEmpresa: string) => void;
  onCargoChange: (cargo: string) => void;
  onTermsChange: (terms: boolean) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({
  email: _email,
  name: _name,
  telephone: _telephone,
  nombreEmpresa: _nombreEmpresa,
  cargo: _cargo,
  terms: _terms,
  aiImageReady,
  imageUrl,
  onEmailChange: _onEmailChange,
  onNameChange: _onNameChange,
  onTelephoneChange: _onTelephoneChange,
  onNombreEmpresaChange: _onNombreEmpresaChange,
  onCargoChange: _onCargoChange,
  onTermsChange: _onTermsChange,
  onContinue,
}) => {
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const hasMergedRef = useRef(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentTitle, setCurrentTitle] = useState(0);

  // Función que se ejecuta cuando termina el merge
  const handleMerged = (url: string) => {
    if (!hasMergedRef.current && url) {
      setMergedImage(url);
      hasMergedRef.current = true;
    }
  };

  // Títulos dinámicos durante la generación
  const loadingTitles = [
    "CREANDO MAGIA OSCURA",
    "INVOCANDO ESPÍRITUS",
    "TRANSFORMACIÓN EN VIVO",
    "PREPARANDO EL SHOW",
    "CAPTURANDO TU ESENCIA",
    "EL CIRCO TE ESPERA"
  ];

  // Mensajes dinámicos durante la generación
  const loadingMessages = [
    "🎪",
    "💀",
    "🎭",
    "⚡",
    "🔮",
    "💀",
  ];

  // Cargar el script de Tally al montar el componente
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Cambiar títulos cada 2 segundos durante la carga
  useEffect(() => {
    if (!aiImageReady) {
      const interval = setInterval(() => {
        setCurrentTitle((prev) => (prev + 1) % loadingTitles.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [aiImageReady, loadingTitles.length]);

  // Cambiar mensajes cada 3 segundos durante la carga
  useEffect(() => {
    if (!aiImageReady) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [aiImageReady, loadingMessages.length]);

  return (
    <div className="waiting-fullscreen">
      <div className="waiting-card-show">
        
        {/* ESTADO: GENERANDO */}
        {!aiImageReady && (
        <div className="creation-show">
              <h1 className="show-title">
                {loadingTitles[currentTitle]}
              </h1>
              
              {/* Spinner épico con efectos */}
              <div className="epic-spinner-container">
                <div className="spinner-ring ring-1"></div>
                <div className="spinner-ring ring-2"></div>
                <div className="spinner-ring ring-3"></div>
                <p className="loading-message">
                  {loadingMessages[currentMessage]}
                </p>
              </div>
            </div>
          )}

          {/* ESTADO: PROCESANDO IMAGEN */}
          {aiImageReady && !mergedImage && (
            <div className="creation-show">
              <div className="epic-spinner-container">
                <div className="spinner-ring ring-1"></div>
                <div className="spinner-ring ring-2"></div>
                <div className="spinner-ring ring-3"></div>
                <p className="loading-message">✨</p>
              </div>
            </div>
          )}

          {/* Componente que fusiona la imagen (oculto) */}
          {aiImageReady && imageUrl && !mergedImage && (
            <div style={{ display: 'none' }}>
              <MergeImage
                imageUrl={imageUrl}
                onMerged={handleMerged}
                tipoSuenio={''}
              />
            </div>
          )}

          {/* ESTADO: ¡LISTO! - BOTÓN GIGANTE */}
          {aiImageReady && mergedImage && (
            <div className="ready-show">
              <div className="success-icon-container">
                <div className="success-icon">🎉</div>
              </div>

              <button
                type="button"
                className="button-epic-reveal"
                onClick={() => onContinue(mergedImage)}
              >
                <span className="button-epic-text">
                  🎪 VER MI FOTO 🎪
                </span>
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default Waiting;
