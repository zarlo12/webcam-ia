import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
// import fondo from "../../assets/img/fondo.png";
import logo from "../../assets/xnova/LogoXnova.png";

import WebcamScene from "../WebcamScene";
import Swal from "sweetalert2"; // Import sweetalert2
import { queueImageProcessing } from "../../services/comfyDeployService";
import { storage } from "../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
// import { FaCamera } from "react-icons/fa";

interface AvatarPhotoProps {
  onProcess: (style?: string, runId?: string, originalImageUrl?: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  onProcess,
}) => {
  // const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Nuevo estado para el estilo

  const webcamRef = useRef<WebcamRef | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Envía la imagen capturada a ComfyDeploy
  const handleProcessImage = async () => {
    if (!capturedImage || !selectedStyle) return;
    
    setIsProcessing(true);
    
    try {
      console.log("📤 Subiendo imagen original a Firebase Storage...");
      
      // Convertir Blob a Data URL para subirlo a Firebase Storage
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });
      
      const dataUrl = await dataUrlPromise;
      
      // Subir imagen original a Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(
        storage,
        `Nutricia_originals_2026/original-${timestamp}.png`
      );
      await uploadString(storageRef, dataUrl, "data_url");
      const originalImageUrl = await getDownloadURL(storageRef);
      
      console.log("✅ Imagen original guardada:", originalImageUrl);
      console.log("📤 Enviando imagen a ComfyDeploy...");
      console.log("🎨 Estilo seleccionado:", selectedStyle);
      
      const response = await queueImageProcessing(capturedImage, selectedStyle);
      
      console.log("✅ Imagen encolada en ComfyDeploy!");
      console.log("🆔 Run ID:", response.run_id);
      
      // Pasar el run_id y la URL de la imagen original al componente padre
      onProcess(selectedStyle, response.run_id, originalImageUrl);
    } catch (error) {
      console.error("❌ Error al procesar la imagen:", error);
      
      setIsProcessing(false);
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo procesar la imagen. Por favor, intenta de nuevo.",
      });
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
        text: "Por favor selecciona un estilo.",
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
                <option value="bebelac">Bebelac</option>
                <option value="ejecutivo">Ejecutivo</option>
                <option value="nutrilon">Nutrilon</option>
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
              disabled={!capturedImageUrl || isProcessing}
            >
              {isProcessing ? "Enviando..." : "Procesar"}
            </button>
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
