import React, { useState, useRef, useEffect } from "react";
import "./Waiting.scss";
import logo from "../../assets/img/logoScotia.png";
import logoVigilado from "../../assets/img/vigilado.png";
import MergeImage from "../AvatarAi/MergeImage"; // Asegúrate de la ruta correcta

interface WaitingProps {
  email: string;
  nombre: string;
  cedula: string;
  imagenGenerada: boolean;
  imageUrl: string;
  tipoSuenio: string;
  onEmailChange: (email: string) => void;
  onNombreChange: (nombre: string) => void;
  onCedulaChange: (cedula: string) => void;
  onConsentimientoChange: (consentimiento: string) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({
  email,
  nombre,
  imagenGenerada,
  imageUrl,
  tipoSuenio,
  onEmailChange,
  onNombreChange,
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

  const handleMerged = async (dataUrl: string) => {
    if (hasMergedRef.current) return;
    hasMergedRef.current = true;
    setMergedImage(dataUrl);
    onContinue(dataUrl);
  };

  return (
    <div className="waiting-container">
      <div className="header-bar">
        <img src={logo} alt="Logo Scotia" className="logo-scotia" />
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
                <br /> ¡A segundos de
                <br /> cumplir tus
                <br /> metas!
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
              placeholder="Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="input"
              required
            />

            <button
              type="button"
              className="button"
              style={{ width: "284px", margin: "20px 0 0 0" }}
              data-tally-open="3jgB21"
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
            >
              Test vocacional
            </button>

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
                  >
                    Ver política de tratamiento de datos
                  </a>
                </span>
              </label>
            </div>
          </form>
        </div>
      </div>

      <div className="footerAlways">
        <img src={logoVigilado} alt="Logo Vigilado" className="logo" />
      </div>
    </div>
  );
};

export default Waiting;
