import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
// import fondo from "../../assets/img/fondo.png";
import logo from "../../assets/img/logoScotia.png";
import WebcamScene from "../WebcamScene";
import axios from "axios";
import Swal from "sweetalert2"; // Import sweetalert2
// import { FaCamera } from "react-icons/fa";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
  onDreamChange: (dream: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  onProcess,
  onDreamChange,
}) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [selectedDream, setSelectedDream] = useState("");

  const webcamRef = useRef<WebcamRef | null>(null);

  const webhookUrl =
    import.meta.env.VITE_N8N_WEBHOOK_URL ||
    "https://xnova360.app.n8n.cloud/webhook-test/497347b7-8019-4f9b-8541-2ae380e51920";
  //const webhookUrl = "https://test231234423234432.com/";

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

  // Envía la imagedn capturada al endpoint de n8n
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    const formData = new FormData();
    formData.append("image", capturedImage, "webcam-image.jpg");
    formData.append("selectedDream", selectedDream);
    try {
      console.log("Enviando imagen...");
      //onProcess(); //TEMPORAL NO DEBE IR AQUI
      const responseFinal = await axios.post(webhookUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      });
      console.log("Imagen enviada a n8n!", responseFinal);
      //alert("Imagen enviada a n8n!");
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
        <img src={logo} alt="Logo Scotia" className="logo" />
      </div>

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
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
          {/* SELECT "Selecciona tu sueño" */}
          <div className="select-container">
            <select
              value={selectedDream}
              onChange={(e) => {
                const dream = e.target.value;
                setSelectedDream(dream);
                onDreamChange(dream); // Llama al callback para elevar la selección
              }}
            >
              <option value="" disabled>
                Selecciona tu Profesión
              </option>
              <option value="Gastronómico">Gastronómico</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Experto en TIC">Experto en TIC</option>
              <option value="Experto en logística">Experto en logística</option>
              <option value="Regente de Farmacia">Regente de Farmacia</option>
              <option value="Experto en SST">Experto en SST</option>
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
          <button type="submit" className="button" disabled={!capturedImageUrl}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AvatarPhoto;
