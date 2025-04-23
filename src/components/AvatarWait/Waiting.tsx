import React, { useState, useRef } from "react";
import "./Waiting.scss";
import logo from "../../assets/img/logoScotia.png";
import logoVigilado from "../../assets/img/vigilado.png";
import MergeImage from "../AvatarAi/MergeImage"; // Asegúrate de la ruta correcta

interface WaitingProps {
  email: string;
  nombre: string;
  cedula: string;
  imagenGenerada: boolean;
  imageUrl: string; // Nuevo prop para la URL de la imagen a fusionar
  tipoSuenio: string;
  onEmailChange: (email: string) => void;
  onNombreChange: (nombre: string) => void;
  onCedulaChange: (cedula: string) => void;
  onConsentimientoChange: (consentimiento: string) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void; // Se recibe la URL fusionada
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
  // Controlamos que el merge se ejecute solo una vez
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const hasMergedRef = useRef(false);

  const handleMerged = async (dataUrl: string) => {
    if (hasMergedRef.current) return;
    hasMergedRef.current = true;
    setMergedImage(dataUrl);
    // Una vez terminado el merge, redirigimos automáticamente a AvatarResult
    onContinue(dataUrl);
  };

  return (
    <div className="waiting-container">
      {/* Barra roja superior con el logo */}
      <div className="header-bar">
        <img src={logo} alt="Logo Scotia" className="logo-scotia" />
      </div>

      {/* Tarjeta de contenido */}
      <div className="main-content">
        <div className="waiting-card">
          <h2 className="subtitle">Avatar IA</h2>

          {imagenGenerada ? (
            <div className="avatar-container-ready">
              {/* Si no se ha ejecutado el merge, y existe imageUrl, lo lanzamos */}
              {!mergedImage && imageUrl && (
                <MergeImage
                  imageUrl={imageUrl}
                  onMerged={handleMerged}
                  tipoSuenio={tipoSuenio}
                />
              )}
            </div>
          ) : (
            ""
          )}

          <div className="avatar-container-wait">
            <p className="waiting-text">
              Espera...
              <br /> ¡A segundos de
              <br /> cumplir tus
              <br /> metas!
            </p>
          </div>

          {/* Formulario de datos */}
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

            {/* <input
            type="text"
            placeholder="Cédula"
            value={cedula}
            onChange={(e) => onCedulaChange(e.target.value)}
            className="input"
            required
          /> */}

            <button
              type="button"
              className="button"
              style={{ width: "284px", margin: "20px 0 0 0" }}
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
