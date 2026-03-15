import React, { useState, useRef, useEffect } from "react";
import "./Waiting.scss";
import logo from "../../assets/img/logo_final.png";

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
  email,
  name,
  telephone,
  nombreEmpresa,
  cargo,
  terms: _terms,
  aiImageReady,
  imageUrl,
  onEmailChange,
  onNameChange,
  onTelephoneChange,
  onNombreEmpresaChange,
  onCargoChange,
  onTermsChange: _onTermsChange,
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
              
            </div>
          )}

          <form className="waiting-form">

             <input
              type="text"
              placeholder="Nombre empresa:"
              value={nombreEmpresa}
              onChange={(e) => onNombreEmpresaChange(e.target.value)}
              className="input hidden-input"
              required
            />


            <input
              type="text"
              placeholder="Nombre:"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="input"
              required
            />

             <input
              type="text"
              placeholder="Cargo:"
              value={cargo}
              onChange={(e) => onCargoChange(e.target.value)}
              className="input hidden-input"
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
              placeholder="Celular:"
              value={telephone}
              onChange={(e) => onTelephoneChange(e.target.value)}
              className="input"
              required
            />

           

           

            {/* <div className="checkbox-container">
              <input
                type="checkbox"
                className="checkbox"
                id="tratamiento"
                checked={_terms}
                onChange={(e) => _onTermsChange(e.target.checked)}
              /> */}
              {/* <label htmlFor="tratamiento">
                <span>
                  Consentimiento
                  <br />
                  <a
                    href="https://claroempresashn.com/index.php/politica-de-privacidad/" 
                    target="_blank"
                    className="linkColorVerde"
                  >
                    Ver política de tratamiento de datos
                  </a>
                </span>
              </label> */}
            {/* </div> */}

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
                  : "🎉 ¡Ver mi avatar!"
              }
            </button>
          </form>
        </div>
      </div>

     
    </div>
  );
};

export default Waiting;
