import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";

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
    return `
      Transform ALL the people in the provided photo into a retro cartoon illustration inspired by classic Peanuts-style aesthetics (Snoopy vibe), with a playful and nostalgic beach theme.

STRICT RULE (VERY IMPORTANT):
ONLY include the exact people present in the original photo.
DO NOT add extra people.
DO NOT generate new faces or background characters.
DO NOT duplicate people.
The number of characters in the final image MUST match the number of people in the input photo exactly.

If there are multiple people, include every person and represent each one as a stylized cartoon character. Do not remove, crop, or ignore anyone. Maintain the original group composition and ensure all individuals are visible.

Each character should look like a cartoon version of the real person: simplified shapes, expressive faces, clean lines, and soft pastel colors. Keep their key features recognizable while adapting them into a charming retro cartoon style.

Create a unique and unexpected composition every time, while respecting the original number of people:

Vary camera angle (front, side, slightly top view, dynamic perspective)
Vary character poses and interactions (walking, sitting, laughing, holding objects, interacting naturally)
Randomize scene elements (surfboards, umbrellas, towels, waves, sunset, clouds)
Allow different layout structures (centered, asymmetrical, diagonal, layered)

Place the characters in a beach environment, allowing creative reinterpretation of the scene, but NEVER adding extra people.

Use a soft pastel color palette consistent with a vintage beach invitation style, with variation in tones and combinations.

Allow creative freedom in composition, pose, and environment, but ALWAYS respecting the exact number of people from the original image.

Add a medium-sized, readable logo that says:
"Fiesta Jesus Avila 2026"

MANDATORY LOGO PLACEMENT:
The text MUST appear ONLY as a banner being pulled by a small airplane in the sky.
The airplane must be visible in the sky.
The banner must be attached to the airplane.
The text must be fully readable.
Do NOT place the text anywhere else.
Do NOT use alternative placements (no signs, no sand, no objects, no sky writing).
If the airplane with banner is missing, the image is incorrect.

FINAL CONSTRAINTS (MANDATORY):
The number of characters must be EXACTLY the same as the input photo.
No extra people, no background silhouettes, no crowd elements.
Do not repeat people.
Do not invent faces.
Keep it clean, friendly, cute, and elegant (not exaggerated or messy).
Maintain visual harmony and softness.

High resolution, clean illustration, modern-retro fusion, highly shareable.

casi, pero ponlo tipo fondo de esta imagen tipo atardecer: 

Imagen creada
•
Fiesta en la playa al atardecer
NO TE DIJE QUE HAGAS IMAGEN, SOLO QUE MEJORES MI PROMOPT

Transform ALL the people in the provided photo into a retro cartoon illustration inspired by classic Peanuts-style aesthetics (Snoopy vibe), using a warm sunset beach background similar to a soft pastel coastal atardecer (sun low on the horizon, orange-pink sky, calm ocean reflections, soft clouds, palm silhouettes).

STRICT RULE (VERY IMPORTANT):
ONLY include the exact people present in the original photo.
DO NOT add extra people.
DO NOT generate new faces or background characters.
DO NOT duplicate people.
The number of characters in the final image MUST match the number of people in the input photo exactly.

If there are multiple people, include every person and represent each one as a stylized cartoon character. Do not remove, crop, or ignore anyone. Maintain the original group composition and ensure all individuals are visible.

Each character should look like a cartoon version of the real person: simplified shapes, expressive faces, clean lines, and soft pastel colors. Keep their key features recognizable while adapting them into a charming retro cartoon style.

Create a unique and unexpected composition every time, while respecting the original number of people:

Vary camera angle (front, side, slightly top view, dynamic perspective)
Vary character poses and interactions (walking, sitting, laughing, holding objects, interacting naturally)
Randomize scene elements (surfboards, umbrellas, towels, waves, beach props)
Allow different layout structures (centered, asymmetrical, diagonal, layered)

ENVIRONMENT RULE:
The scene MUST always be a beach at sunset (atardecer).
Include a visible sun near the horizon.
Use warm gradients (orange, pink, soft yellow, light purple).
Water must reflect the sunset tones.
Lighting must be soft, warm, and cohesive with sunset ambiance.
Do not use daytime or night lighting.

Place the characters naturally within this sunset beach environment without adding extra people.

Use a soft pastel color palette consistent with a vintage beach invitation style, adapted to sunset tones.

Allow creative freedom in composition, pose, and environment, but ALWAYS respecting the exact number of people from the original image.

Add a medium-sized, readable logo that says:
"Fiesta Jesus Avila 2026"

MANDATORY LOGO PLACEMENT:
The text MUST appear ONLY as a banner being pulled by a small airplane in the sky.
The airplane must be visible in the sky.
The banner must be attached to the airplane.
The text must be fully readable.
Do NOT place the text anywhere else.
Do NOT use alternative placements (no signs, no sand, no objects, no sky writing).
If the airplane with banner is missing, the image is incorrect.

FINAL CONSTRAINTS (MANDATORY):
The number of characters must be EXACTLY the same as the input photo.
No extra people, no background silhouettes, no crowd elements.
Do not repeat people.
Do not invent faces.
Keep it clean, friendly, cute, and elegant (not exaggerated or messy).
Maintain visual harmony and softness.

High resolution, clean illustration, modern-retro fusion, highly shareable.
    `;
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
