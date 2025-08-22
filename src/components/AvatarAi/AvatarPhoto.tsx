import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
// import fondo from "../../assets/img/fondo.png";
import logo from "../../assets/xnova/LogoXnova.png";

import WebcamScene from "../WebcamScene";
import axios from "axios";
import Swal from "sweetalert2"; // Import sweetalert2
// import { FaCamera } from "react-icons/fa";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  onProcess,
}) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Nuevo estado para el estilo

  const webcamRef = useRef<WebcamRef | null>(null);

  // URLs de los endpoints según el estilo
  const realistaUrl = import.meta.env.VITE_REALISTA_WEBHOOK_URL || 
    "https://xnova360.app.n8n.cloud/webhook/4c07f695-b8e7-48ed-81ae-4af3adc78b71";
  
  const caricaturaUrl = import.meta.env.VITE_CARICATURA_WEBHOOK_URL || 
    "https://xnova360.app.n8n.cloud/webhook/7f744819-6e36-43f0-ac4a-2c8810426a52";

  // Función para obtener la URL según el estilo seleccionado
  const getWebhookUrl = () => {
    switch (selectedStyle) {
      case "realista":
        return realistaUrl;
      case "caricatura":
        return caricaturaUrl;
      default:
        return realistaUrl; // Por defecto realista
    }
  };

  // Función para capturar la imagen desde el componente WebcamScene
  const handleCapture = async () => {
    if (webcamRef.current && webcamRef.current.captureImage) {
      try {
        const blob = await webcamRef.current.captureImage();
        setCapturedImage(blob);
        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
      } catch (error) {
        console.error("Error al capturar la imagen:", error);
      }
    }
  };

  // Envía la imagen capturada al endpoint de n8n
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    const formData = new FormData();
    formData.append("image", capturedImage, "webcam-image.jpg");
    
    const currentWebhookUrl = getWebhookUrl();
  
    try {
      console.log("Enviando imagen...");
      console.log("Estilo seleccionado:", selectedStyle);
      console.log("URL del webhook:", currentWebhookUrl);
      
      const responseFinal = await axios.post(currentWebhookUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      });
      console.log("Imagen enviada a n8n!", responseFinal);
      onProcess(email); // Cambia de pantalla (por ejemplo, a 'waiting')
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
    }
  };

  // Permite reiniciar la captura para tomar otra foto
  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
  };

  // Validación del formulario y envío de la imagen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya seleccionado un estilo
    if (!selectedStyle) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un estilo (realista o caricatura).",
      });
      return;
    }

    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Primero toma una foto.",
      });
      return;
    }
    onProcess(email);
    handleProcessImage();
  };

  return (
    <div className="container">
      {/* Cabecera superior con fondo rojo y logo centrado */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
      <div className="main-content">
        <div className="card">
          <h2 className="subtitle">AVATAR AI</h2>
          <div className="avatar-container cam">
            {capturedImageUrl ? (
              // Si ya se capturó la imagen, se muestra la imagen fija
              <img
                src={capturedImageUrl}
                alt="Foto capturada"
                className="fotoCapturada"
              />
            ) : (
              // Si no, se muestra el feed en vivo de la cámara
              <WebcamScene ref={webcamRef} />
            )}
          </div>

          <div className="buttons-container">
            {/* SELECT para elegir estilo */}
            <div className="select-container">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona el estilo
                </option>
                <option value="realista">Estilo Realista</option>
                <option value="caricatura">Estilo Caricatura</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
            >
              <div
                style={{
                  // display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {/* <FaCamera size={38} style={{ marginRight: "8px" }} /> */}
                {capturedImageUrl ? "Tomar otra" : "Tomar foto"}
              </div>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="button"
              disabled={!capturedImageUrl}
            >
              Procesar
            </button>
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
