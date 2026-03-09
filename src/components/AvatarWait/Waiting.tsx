import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Waiting.scss";
import logo from "../../assets/xnova/LogoXnova.png";
import Swal from "sweetalert2";

import MergeImage from "../AvatarAi/MergeImage"; // Asegúrate de la ruta correcta
import { 
  getRunStatus, 
  extractGeneratedImageUrl, 
  extractErrorMessage,
  saveRunStatusToFirestore 
} from "../../services/comfyDeployService";
import type { ComfyDeployStatusResponse } from "../../types/comfyDeploy";

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

  runId: string; // ID del run de ComfyDeploy
  imageUrl: string;
  selectedStyle?: string; // Estilo seleccionado en AvatarPhoto
  onEmailChange: (email: string) => void;
  onNombreChange: (nombre: string) => void;
  onCiudadChange: (ciudad: string) => void;
  onFormularioChange: (formulario: string) => void;

  onConsentimientoChange: (consentimiento: string) => void;
  onShowPolicy: () => void;
  onContinue: (mergedUrl: string) => void;
  onImageUrlChange: (url: string) => void; // Callback para actualizar la imagen en App
}

// Mensajes dinámicos según el progreso
const getProgressMessage = (progress: number): string => {
  if (progress < 15) return "Iniciando la magia...";
  if (progress < 30) return "Analizando tu foto...";
  if (progress < 50) return "Creando tu avatar...";
  if (progress < 70) return "Aplicando detalles...";
  if (progress < 90) return "Últimos retoques...";
  return "¡Casi listo!";
};

const Waiting: React.FC<WaitingProps> = ({
  email,
  nombre,
  // ciudad,
  // formulario,
  runId,
  imageUrl,
  selectedStyle,
  onEmailChange,
  onNombreChange,
  // onCiudadChange,
  // onFormularioChange,
  onConsentimientoChange,
  onShowPolicy,
  onContinue,
  onImageUrlChange,
}) => {
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<ComfyDeployStatusResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Preparando tu avatar...");
  const [progressMessage, setProgressMessage] = useState<string>("Iniciando la magia...");
  const hasMergedRef = useRef(false);
  const navigate = useNavigate();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Polling para verificar el estado del run en ComfyDeploy
  useEffect(() => {
    if (!runId) return;
    
    const checkRunStatus = async () => {
      try {
        const status = await getRunStatus(runId);
        setRunStatus(status);
        
        // Guardar en Firestore
        await saveRunStatusToFirestore(runId, status);
        
        // Actualizar mensaje según el estado
        if (status.status === "queued") {
          setStatusMessage("Preparando tu avatar...");
          setProgressMessage("Iniciando la magia...");
        } else if (status.status === "running") {
          const progressPercent = Math.round(status.progress * 100);
          setStatusMessage(`Generando tu avatar...`);
          setProgressMessage(getProgressMessage(progressPercent));
        } else if (status.status === "success") {
          setStatusMessage("¡Avatar generado exitosamente!");
          setProgressMessage("¡Completado!");
          
          // Extraer la URL de la imagen
          const generatedImageUrl = extractGeneratedImageUrl(status);
          
          if (generatedImageUrl) {
            console.log("✅ Imagen generada:", generatedImageUrl);
            onImageUrlChange(generatedImageUrl);
            
            // Detener el polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        } else if (status.status === "failed") {
          setStatusMessage("Error al procesar la imagen");
          
          // Detener el polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Extraer mensaje de error
          const errorMessage = extractErrorMessage(status);
          
          // Mostrar alerta
          await Swal.fire({
            icon: 'error',
            title: '¡Oops! Algo salió mal',
            text: errorMessage || 'Hubo un error procesando tu imagen. Por favor, toma una nueva foto.',
            confirmButtonText: 'Tomar nueva foto',
            confirmButtonColor: '#31afda',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          
          // Recargar toda la página
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error checking run status:', error);
        setStatusMessage("Error al verificar el estado");
      }
    };
    
    // Verificar inmediatamente
    checkRunStatus();
    
    // Iniciar polling cada 3 segundos
    pollingIntervalRef.current = setInterval(checkRunStatus, 3000);
    
    // Limpiar al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [runId, navigate, onImageUrlChange]);

  const handleMerged = async (dataUrl: string) => {
    if (hasMergedRef.current) return;
    hasMergedRef.current = true;
    setMergedImage(dataUrl);
    onContinue(dataUrl);
  };
  
  // Determinar si la imagen está lista para mostrar
  const imagenGenerada = runStatus?.status === "success" && imageUrl;

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
              {/* Spinner animado */}
              <div className="ai-loader">
                <div className="ai-loader-spinner"></div>
                <div className="ai-loader-glow"></div>
              </div>
              
              {/* Mensaje principal */}
              <h3 className="waiting-title">
                {statusMessage}
              </h3>
              
              {/* Mensaje descriptivo dinámico */}
              <p className="progress-message">
                {progressMessage}
              </p>
              
              {/* Barra de progreso */}
              {runStatus && runStatus.status === "running" && (
                <div className="progress-bar-container">
                  <div className="progress-bar-wrapper">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${Math.round(runStatus.progress * 100)}%` }}
                    >
                      <div className="progress-bar-shimmer"></div>
                    </div>
                  </div>
                  <span className="progress-percentage">
                    {Math.round(runStatus.progress * 100)}%
                  </span>
                </div>
              )}
              
              {/* Indicador de estado cuando está en cola */}
              {runStatus && runStatus.status === "queued" && (
                <div className="queued-indicator">
                  <div className="queued-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
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
              placeholder="Correo electrónico"
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
