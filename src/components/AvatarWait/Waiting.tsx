import React, { useState, useRef, useEffect } from "react";
import "./Waiting.scss";
import logo from "../../assets/img/LOGO-XNOVA.png";

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
  nombre: string;
  celular: string;

  imagenGenerada: boolean;
  imageUrl: string;
  tipoSuenio: string;
  onEmailChange: (email: string) => void;
  onNombreChange: (nombre: string) => void;
  onCelularChange: (celular: string) => void;

  onConsentimientoChange: (consentimiento: string) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({
  email,
  nombre,
  celular,
  imagenGenerada,
  imageUrl,
  tipoSuenio,
  onEmailChange,
  onNombreChange,
  onCelularChange,
  onConsentimientoChange,
  onShowPolicy,
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
    setMergedImage(dataUrl);
    onContinue(dataUrl);
  };

  return (
    <div className="waiting-container">
      <div className="header-bar">
        <img src={logo} alt="Logo" className="logo-scotia" />
      </div>

      <div className="main-content">
        <div className="waiting-card">
          <h2 className="subtitle">Avatar IA</h2>

          {imagenGenerada && (
            <div className="avatar-container-ready">
              {!mergedImage && imageUrl && (
                <MergeImage
                  imageUrl={imageUrl}
                  onMerged={handleMerged}
                  tipoSuenio={tipoSuenio}
                />
              )}
            </div>
          )}

          {!imagenGenerada && (
            <div className="avatar-container-wait">
              <p className="waiting-text">
                Espera...
                
              </p>
            </div>
          )}

          <form className="waiting-form">
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              className="input"
              required
            />

           <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="input"
              required
            />

            <input
              type="text"
              placeholder="Celular"
              value={celular}
              onChange={(e) => onCelularChange(e.target.value)}
              className="input"
              required
            />

           

            

            {/* <button
              type="button"
              className="button"
              onClick={openVocacionalTest}
              style={{ width: "284px", margin: "20px 0 0 0" }}
            >
              Test vocacional
            </button> */}

            <div className="checkbox-container">
              <input
                type="checkbox"
                className="checkbox"
                id="tratamiento"
                onChange={(e) => onConsentimientoChange(e.target.value)}
              />
              <label htmlFor="tratamiento">
                <span>
                  Consentimiento
                  <br />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onShowPolicy();
                    }}
                    className="linkColorVerde"
                  >
                    Ver política de tratamiento de datos
                  </a>
                </span>
              </label>
            </div>
          </form>
        </div>
      </div>

     
    </div>
  );
};

export default Waiting;
