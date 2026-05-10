import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";

import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";
import { StyleChoice } from "../../App";

interface AvatarPhotoProps {
  styleChoice: StyleChoice;
  onProcess: () => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const LOGO_URL =
  'https://replicate.delivery/pbxt/OgeG3mQ98GKDjIBB2PN0WUhQw8QmAJLgMN4Iad3lNMHhM86Z/LOGO.jpg';

const STYLE_LABELS: Record<StyleChoice, string> = {
  1: 'ACUARELA',
  2: '3D ANIMADO',
  3: 'VINTAGE',
};

const PROMPTS: Record<StyleChoice, string> = {
  1: `Use the first attached image and the second attached image as the brand logo.

EXACT PEOPLE COUNT — CRITICAL:
Count the number of people in the first image. Reproduce ONLY those exact people — no more, no less.
Do NOT add, invent, generate, or hallucinate any additional person, figure, silhouette, or character that does not appear in the original photo.
If the photo has 1 person → final image has exactly 1 person. If 3 people → exactly 3 people. Never add extras. Never fill empty space with invented figures.

GROUP RULE — MANDATORY:
All people from the original photo must appear in the final image. Do NOT crop anyone. Do NOT merge faces. Extend canvas if needed.

FULL ARTISTIC TRANSFORMATION — WATERCOLOR + 3D HYBRID:
Transform EVERY element — including ALL faces — into a soft watercolor illustrated style with subtle 3D depth.
THIS IS NOT A PHOTO FILTER. Every person must look hand-painted and illustrated, not photorealistic.
Faces must be rendered in the SAME watercolor + painterly 3D style as the rest of the image. No photorealistic faces.
Use the original photo only as a structural reference for poses, arrangement, and general likeness.

BACKGROUND:
- Hand-painted floral garden backdrop
- Soft watercolor roses and peonies
- Pastel sky gradient (peach to pink)
- Delicate golden sparkles
- Elegant decorative illustrated frame around the group

COMPOSITION: Vertical. Expand canvas if needed. Keep original group arrangement.

BRANDING: Add "Feliz Día de las Madres". Place the logo (second image) elegantly at top.

OUTPUT: High-resolution 4K. Fully consistent watercolor + illustrated style — faces, clothing, background, everything.`,

  2: `Use the first attached image and the second attached image as the brand logo.

EXACT PEOPLE COUNT — CRITICAL:
Count the number of people in the first image. Reproduce ONLY those exact people — no more, no less.
Do NOT add, invent, generate, or hallucinate any additional person, figure, silhouette, or character that does not appear in the original photo.
If the photo has 1 person → final image has exactly 1 person. If 3 people → exactly 3 people. Never add extras. Never fill empty space with invented figures.

GROUP RULE — MANDATORY:
All people from the original photo must be visible. No cropping. No removal. No face merging. Extend background if needed.

FULL ARTISTIC TRANSFORMATION — CINEMATIC 3D ANIMATION:
Transform EVERY element — including ALL faces — into a high-end cinematic 3D animated style (think Pixar / Disney / high-budget animated film).
THIS IS AN ILLUSTRATION, NOT A PHOTO. Every person must look like a 3D animated character, not a real photograph.
Faces must be fully rendered in 3D animation style: smooth textures, stylized shading, expressive but not caricatured.
The original photo is only a reference for pose, composition, and general likeness. Do NOT use the original as a texture.

BACKGROUND:
- Elegant stage-style floral backdrop
- Hanging decorative flowers and ribbons
- Soft pink and coral lighting
- Subtle confetti particles
- Warm spotlight glow behind the group
- Decorative heart and floral accents (tasteful, not childish)

LIGHTING: Cinematic contrast. Soft rim light. Premium glossy 3D finish.
FRAMING: Vertical hero poster. All people clearly visible and balanced.

BRANDING: Integrate the logo (second image) at top. Add bold elegant text: "Feliz Día de las Madres".
OUTPUT: 4K vertical. Fully consistent 3D animated style — faces, clothing, background, everything.`,

  3: `Use the first attached image as the photo reference and the second attached image as the brand logo.

EXACT PEOPLE COUNT — CRITICAL:
Count the number of people in the first image. Reproduce ONLY those exact people — no more, no less.
Do NOT add, invent, generate, or hallucinate any additional person, figure, silhouette, or character that does not appear in the original photo.
If the photo has 1 person → final image has exactly 1 person. If 3 people → exactly 3 people. Never add extras. Never fill empty space with invented figures.

PEOPLE PRESERVATION — MANDATORY:
ALL people visible in the original photo must appear in the final image. Do NOT crop, remove, blur, merge, or hide anyone.
Preserve each person's face, facial identity, age, proportions, skin tone, and posture faithfully.
Preserve original number of people, their spacing, and arrangement.
If needed, expand or zoom out the canvas — never crop people out.

STYLE: Vintage Warm Analog Film Portrait
This is a photographic color grading and atmosphere treatment — NOT an artistic illustration.
Apply the vintage aesthetic as a visual layer over the real photo:
- Warm golden-amber color grade across the entire image
- Subtle film grain texture on everything
- Gentle vignetting at the edges
- Slight light leak on one corner
- Soft overall glow, boosted contrast, lifted shadows
Faces must remain photorealistic, natural, and clearly recognizable — only warmed and toned by the vintage palette. Do NOT illustrate, paint, or distort faces.

BACKGROUND REPLACEMENT:
Replace only the background behind the people with an elegant vintage garden party setting:
- Lush floral arrangements with roses and peonies in muted warm tones
- Warm fairy lights softly blurred in the background
- Pastel fabric bunting and draping
- Soft golden-hour backlight creating a warm halo behind the group

COMPOSITION: Vertical portrait. All people fully visible (waist-up or full body matching the original). Centered and balanced.

BRANDING: Place the logo (second image) top-center. Below it, add "Feliz Día de las Madres" in an elegant classic serif script. Keep branding subtle and tasteful.

OUTPUT: 4K vertical, poster-quality. Warm, cinematic, emotionally beautiful vintage photograph — people look like themselves, just bathed in golden analog warmth.`,
};

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  styleChoice,
  onProcess,
  onAiImageReady,
}) => {
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const webcamRef = useRef<WebcamRef | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleCapture = async () => {
    if (!webcamRef.current?.captureImage) return;
    try {
      const blob = await webcamRef.current.captureImage();
      setCapturedImage(blob);
      setCapturedImageUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo capturar la imagen. Inténtalo de nuevo.' });
    }
  };

  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl('');
  };

  const handleProcessImage = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      const originalImageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });

      onProcess();

      const prompt = PROMPTS[styleChoice];
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        'dia-madres',
        'user-' + Date.now(),
        'google/nano-banana-2',
        LOGO_URL,
      );

      if (result.success && result.imageUrl) {
        onAiImageReady(result.imageUrl, originalImageDataUrl);
      } else {
        console.error('Error al generar imagen:', result.error);
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) {
      Swal.fire({ icon: 'warning', title: '¡Ups!', text: 'Primero toma una foto.' });
      return;
    }
    if (!isProcessing) handleProcessImage();
  };

  return (
    <div className="photo-container">
      <button onClick={toggleFullscreen} className="photo-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="photo-header">
        <div className="photo-date-chip">🌸 10 DE MAYO 🌸</div>
        <h1 className="photo-title-main">Día de las <span className="photo-title-accent">Madres</span></h1>
        <p className="photo-subtitle">sonríe y toma tu foto familiar</p>
        <div className="photo-badge">{STYLE_LABELS[styleChoice]}</div>
      </div>

      <div className="photo-main">
        <div className="photo-cam-wrapper">
          {capturedImageUrl ? (
            <img src={capturedImageUrl} alt="Foto capturada" className="photo-captured" />
          ) : (
            <WebcamScene ref={webcamRef} />
          )}
          <div className="photo-cam-corner photo-cam-corner--tl" />
          <div className="photo-cam-corner photo-cam-corner--tr" />
          <div className="photo-cam-corner photo-cam-corner--bl" />
          <div className="photo-cam-corner photo-cam-corner--br" />
        </div>

        <form className="photo-actions" onSubmit={handleSubmit}>
          <button
            type="button"
            className="photo-btn photo-btn--secondary"
            onClick={capturedImageUrl ? handleResetCapture : handleCapture}
            disabled={isProcessing}
          >
            {capturedImageUrl ? 'OTRA FOTO' : 'TOMAR FOTO'}
          </button>

          <button
            type="submit"
            className="photo-btn photo-btn--primary"
            disabled={!capturedImageUrl || isProcessing}
          >
            {isProcessing ? 'PROCESANDO...' : 'CREAR RECUERDO 💐'}
          </button>
        </form>
      </div>

      <div className="photo-footer">
        <span>— 💐 con amor · día de las madres —</span>
      </div>
    </div>
  );
};

export default AvatarPhoto;
