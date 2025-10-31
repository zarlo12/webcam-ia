import React, { useState, useRef, useEffect } from "react";
import "./Waiting.scss";
import logo from "../../assets/ban100/logo.svg";

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
  caracteristicas: string;
  comprar: string;
  email: string;
  marca: string;
  name: string;
  origem: string;
  rangoEdad: string;
  renovar: string;
  telephone: string;
  terms: boolean;
  imagenGenerada: boolean;
  aiImageReady: boolean;
  imageUrl: string;
  onCaracteristicasChange: (caracteristicas: string) => void;
  onComprarChange: (comprar: string) => void;
  onEmailChange: (email: string) => void;
  onMarcaChange: (marca: string) => void;
  onNameChange: (name: string) => void;
  onRangoEdadChange: (rangoEdad: string) => void;
  onRenovarChange: (renovar: string) => void;
  onTelephoneChange: (telephone: string) => void;
  onTermsChange: (terms: boolean) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({
  caracteristicas,
  comprar,
  email,
  marca,
  name,
  rangoEdad,
  renovar,
  telephone,
  terms,
  aiImageReady,
  imageUrl,
  onCaracteristicasChange,
  onComprarChange,
  onEmailChange,
  onMarcaChange,
  onNameChange,
  onRangoEdadChange,
  onRenovarChange,
  onTelephoneChange,
  onTermsChange,
  onContinue,
}) => {
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const hasMergedRef = useRef(false);

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

  // Función para abrir el popup dimensionado
  
  const handleMerged = async (dataUrl: string) => {
    if (hasMergedRef.current) return;
    hasMergedRef.current = true;
    console.log("🎯 Imagen fusionada completada, habilitando botón");
    setMergedImage(dataUrl);
    // No llamamos onContinue aquí automáticamente, esperamos que el usuario haga clic
  };

  // Debug: log de estados
  useEffect(() => {
    console.log("🔍 Estados en Waiting:", {
      aiImageReady,
      imageUrl: !!imageUrl,
      mergedImage: !!mergedImage,
      imageUrlValue: imageUrl
    });
  }, [aiImageReady, imageUrl, mergedImage]);

  return (
    <div className="waiting-container">
      <div className="header-bar">
        <img src={logo} alt="Logo" className="logo-scotia" />
      </div>

      <div className="main-content">
        <div className="waiting-card">
          {/* <h2 className="subtitle">Avatar IA</h2> */}

          {aiImageReady && (
            <div className="avatar-container-ready">
              {!mergedImage && imageUrl && (
                <MergeImage
                  imageUrl={imageUrl}
                  onMerged={handleMerged}
                  tipoSuenio={''}
                />
              )}
            </div>
          )}

          {!aiImageReady && (
            <div className="avatar-container-wait">
              <div className="loading-spinner"></div>
              <p className="waiting-text">
                Espera...
                
              </p>
            </div>
          )}

          <form className="waiting-form">
            <input
              type="text"
              placeholder="Nombre:"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="input"
              required
            />

            <input
              type="email"
              placeholder="Correo:"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="input"
              required
            />

            <input
              type="text"
              placeholder="Teléfono:"
              value={telephone}
              onChange={(e) => onTelephoneChange(e.target.value)}
              className="input"
              required
            />

            <select
              value={rangoEdad}
              onChange={(e) => onRangoEdadChange(e.target.value)}
              className="input"
              required
            >
              <option value="">Rango de edad</option>
              <option value="18-25">18-25</option>
              <option value="26-35">26-35</option>
              <option value="36-45">36-45</option>
              <option value="46-55">46-55</option>
              <option value="56+">56+</option>
            </select>

            <select
              value={caracteristicas}
              onChange={(e) => onCaracteristicasChange(e.target.value)}
              className="input"
              required
            >
              <option value="">¿Qué característica buscas?</option>
              <option value="cocina">Cocina</option>
              <option value="lavado">Lavado</option>
              <option value="refrigeracion">Refrigeración</option>
              <option value="climatizacion">Climatización</option>
            </select>

            <select
              value={renovar}
              onChange={(e) => onRenovarChange(e.target.value)}
              className="input"
              required
            >
              <option value="">¿Qué quieres renovar?</option>
              <option value="cocina">Cocina</option>
              <option value="lavanderia">Lavandería</option>
              <option value="hogar">Todo el hogar</option>
            </select>

            <select
              value={comprar}
              onChange={(e) => onComprarChange(e.target.value)}
              className="input"
              required
            >
              <option value="">¿Cuándo planeas comprar?</option>
              <option value="inmediato">Inmediatamente</option>
              <option value="1-3meses">En 1-3 meses</option>
              <option value="6meses">En 6 meses</option>
              <option value="1año">En 1 año</option>
            </select>

            <select
              value={marca}
              onChange={(e) => onMarcaChange(e.target.value)}
              className="input"
              required
            >
              <option value="">¿Conoces la marca Electrolux?</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>

            <div className="checkbox-container">
              <input
                type="checkbox"
                className="checkbox"
                id="tratamiento"
                checked={terms}
                onChange={(e) => onTermsChange(e.target.checked)}
              />
              <label htmlFor="tratamiento">
                <span>
                  Consentimiento
                  <br />
                  <a
                    href="https://www.electrolux.com.co/politica-de-privacidad" 
                    target="_blank"
                    className="linkColorVerde"
                  >
                    Ver política de tratamiento de datos
                  </a>
                </span>
              </label>
            </div>

            {/* Botón dinámico para ver la imagen generada */}
            <button
              type="button"
              className="button btnVerAvatar"
              onClick={() => {
                if (aiImageReady && mergedImage) {
                  onContinue(mergedImage);
                }
              }}
              disabled={!aiImageReady || !mergedImage}
              style={{ 
                width: "284px", 
                margin: "20px 0 0 0",
                opacity: (!aiImageReady || !mergedImage) ? 0.6 : 1,
                fontSize: "18px"
              }}
            >
              {!aiImageReady 
                ? "Creando tu avatar..." 
                : !mergedImage 
                  ? "Finalizando imagen..." 
                  : "¡Ver mi avatar!"
              }
            </button>
          </form>
        </div>
      </div>

     
    </div>
  );
};

export default Waiting;
