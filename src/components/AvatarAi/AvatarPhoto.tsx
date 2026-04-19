import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logo_final.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess, onAiImageReady }) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const webcamRef = useRef<WebcamRef | null>(null);

  const getBirthdayBeachPrompt = (): string => {
    return `Transform ALL the people in the photo into a retro cartoon illustration inspired by classic Peanuts-style aesthetics (Snoopy vibe), with a playful and nostalgic beach theme. If there are multiple people, include every person and represent each one as a stylized cartoon character. Do not remove, crop, or ignore anyone. Maintain group composition and make sure everyone is visible. Each character should look like a cartoon version of the real person: simplified shapes, expressive faces, clean lines, and soft pastel colors. Keep their key features recognizable while adapting them into a charming retro cartoon style. Create a unique and unexpected composition every time: Vary camera angle (front, side, slightly top view, dynamic perspective) Vary character poses and interactions (walking, sitting, laughing, holding objects, interacting naturally) Randomize scene elements (surfboards, beach car, umbrellas, towels, signs, waves, sunset, clouds) Allow different layout structures (centered, asymmetrical, diagonal, layered) Place the characters in a beach environment, but allow creative reinterpretation of the scene — it can feel different each time while keeping the same retro coastal vibe. Use a soft pastel color palette consistent with a vintage beach invitation style, but allow variation in tones and combinations. Allow creative freedom in composition, pose, and environment — the result should feel like a new original illustration every time, not a repeated template. Add a medium-sized, readable logo that says: "Fiesta Jesus Avila 2026" The logo must: Be clearly readable Be secondary in importance Appear in different creative ways each time (for example: sign, sky text, sand writing, banner, object detail, etc.) Blend naturally into the scene IMPORTANT: Include ALL people from the original photo Do NOT cut people out or replace them Avoid repeating the same composition, pose, or layout Keep it friendly, cute, and elegant (not exaggerated or messy) Maintain visual harmony and softness All text must be exactly as written High resolution, clean illustration, modern-retro fusion, highly shareable`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  const handleCapture = async () => {
    if (webcamRef.current && webcamRef.current.captureImage) {
      try {
        const blob = await webcamRef.current.captureImage();
        setCapturedImage(blob);
        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
      } catch (error) {
        console.error("Error al capturar la imagen:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo capturar la imagen. Inténtalo de nuevo.",
        });
      }
    }
  };

  const handleProcessImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    try {
      console.log("🎉 Procesando imagen para la fiesta...");

      const reader = new FileReader();
      const originalImageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });

      onProcess(email);

      const prompt = getBirthdayBeachPrompt();
      console.log("🏖️ Prompt de Fiesta Jesus Avila 2026 generado");

      const model = "google/nano-banana";
      console.log(`🤖 Usando modelo: ${model}`);

      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        "birthday-beach",
        "user-" + Date.now(),
        model
      );

      if (result.success && result.imageUrl) {
        console.log("✅ Ilustración generada exitosamente:", result.imageUrl);
        onAiImageReady(result.imageUrl, originalImageDataUrl);
      } else {
        console.error("❌ Error al generar ilustración:", result.error);
      }

    } catch (error) {
      console.error("❌ Error al procesar la imagen:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "¡Ups!",
        text: "Primero toma una foto para la fiesta.",
      });
      return;
    }

    if (isProcessing) return;

    handleProcessImage();
  };

  return (
    <div className="container">
      <button
        onClick={toggleFullscreen}
        className="fullscreen-button"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? "⛶" : "⛶"}
      </button>

     

      <div className="main-content">
        <div className="card">
          <div className="avatar-container cam">
            {capturedImageUrl ? (
              <img
                src={capturedImageUrl}
                alt="Foto capturada"
                className="fotoCapturada"
              />
            ) : (
              <WebcamScene ref={webcamRef} />
            )}
          </div>

          <div className="buttons-container">
            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
              disabled={isProcessing}
            >
              {capturedImageUrl ? "📸 Otra foto" : "📸 Tomar foto"}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="button button-primary"
              disabled={!capturedImageUrl || isProcessing}
            >
              {isProcessing ? "🎨 Creando..." : "🎉 ¡Crear ilustración!"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvatarPhoto;
