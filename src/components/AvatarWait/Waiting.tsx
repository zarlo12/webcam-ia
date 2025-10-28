import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Waiting.scss";
import logo from "../../assets/policia/logo.png";
import Swal from "sweetalert2";

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
  ciudad: string;
  formulario: string;

  imagenGenerada: boolean;
  imageUrl: string;
  selectedStyle?: string; // Estilo seleccionado en AvatarPhoto
  onEmailChange: (email: string) => void;
  onNombreChange: (nombre: string) => void;
  onCiudadChange: (ciudad: string) => void;
  onFormularioChange: (formulario: string) => void;

  onConsentimientoChange: (consentimiento: string) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
}

const Waiting: React.FC<WaitingProps> = ({
  email,
  nombre,
  // formulario,
  imagenGenerada,
  imageUrl,
  selectedStyle,
  onEmailChange,
  onNombreChange,
  // onFormularioChange,
  onConsentimientoChange,
  onShowPolicy,
  onContinue,
}) => {
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const hasMergedRef = useRef(false);
  const navigate = useNavigate();
  const errorCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // API para verificar errores
  const ERROR_CHECK_URL = "https://proyectoshm.com/marco_pruebas/imagen/check_error.php";

  // Función para verificar errores en la API
  const checkForErrors = async () => {
    try {
      const response = await fetch(ERROR_CHECK_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error_triggered === true) {
        // Limpiar el intervalo para evitar múltiples alertas
        if (errorCheckIntervalRef.current) {
          clearInterval(errorCheckIntervalRef.current);
          errorCheckIntervalRef.current = null;
        }

        // Limpiar el estado de error en el servidor
        await fetch(`${ERROR_CHECK_URL}?clear=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Mostrar alerta bonita
        await Swal.fire({
          icon: 'error',
          title: '¡Oops! Algo salió mal',
          text: 'Hubo un error procesando tu imagen. Por favor, toma una nueva foto.',
          confirmButtonText: 'Tomar nueva foto',
          confirmButtonColor: '#31afda',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        // Redirigir al home
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking for API errors:', error);
      // No mostrar alerta para errores de red/API para no molestar al usuario
    }
  };

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

  // Verificación de errores cada 3 segundos
  useEffect(() => {
    // Iniciar la verificación de errores
    errorCheckIntervalRef.current = setInterval(checkForErrors, 3000);

    // Limpiar el intervalo al desmontar el componente
    return () => {
      if (errorCheckIntervalRef.current) {
        clearInterval(errorCheckIntervalRef.current);
        errorCheckIntervalRef.current = null;
      }
    };
  }, [navigate]); // Agregamos navigate como dependencia

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
                  tipoSuenio={''}
                  selectedStyle={selectedStyle}
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


            {/* <input
              type="text"
              placeholder="ID"
              value={ciudad}
              onChange={(e) => onCiudadChange(e.target.value)}
              className="input"
              required
            /> */}

          

            {/* <input
              type="text"
              placeholder="Teléfono"
              value={formulario}
              onChange={(e) => onFormularioChange(e.target.value)}
              className="input"
              required
            /> */}

             <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
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
