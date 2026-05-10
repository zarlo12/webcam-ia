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

const GROUP_LOCK = `
CRITICAL GROUP PRESERVATION RULE — MANDATORY, NO EXCEPTIONS:
Every single person visible in the original photo MUST appear in the final image.
- Do NOT crop, remove, blur, merge, or hide any person.
- Preserve exact number of people, their spacing and relative positions.
- Preserve original facial identities: facial proportions, skin tone, age, hairstyle, distinctive features.
- If canvas space is needed, EXPAND the image — never crop people.
- Do NOT replace faces with generic or idealized versions.`;

const LOGO_BLOCK = `
LOGO & TEXT (MANDATORY):
- The second attached image is the brand logo. Place it prominently at the top-center of the composition.
- Keep the logo clearly visible, unmodified, and well-proportioned.
- Add the text "Feliz Día de las Madres" in an elegant script or serif font.
- The text must be readable and tasteful — not childish.`;

const PROMPTS: Record<StyleChoice, string> = {
  1: `Transform this family photo into a soft watercolor + subtle 3D hybrid Mother's Day portrait.
${GROUP_LOCK}
${LOGO_BLOCK}

STYLE:
- Soft watercolor illustration blended with subtle 3D painterly rendering.
- Warm, romantic, hand-painted aesthetic.

BACKGROUND REPLACEMENT:
- Hand-painted floral garden backdrop.
- Soft watercolor roses, peonies, and cherry blossoms.
- Pastel sky gradient: peach fading into soft pink.
- Delicate golden sparkles and light bokeh.
- Elegant decorative illustrated frame around the group.

COMPOSITION:
- Vertical format (portrait orientation).
- Maintain original group arrangement and postures.
- Expand canvas if needed to fit everyone comfortably.

LIGHTING:
- Soft, diffused, warm golden light from above.
- Gentle rim light on subjects.

MOOD:
- Warm, loving, celebratory, elegant.

OUTPUT:
- High-resolution 4K vertical.
- Consistent painterly style throughout.`,

  2: `Transform this family photo into a vibrant cinematic 3D animated poster for Mother's Day.
${GROUP_LOCK}
${LOGO_BLOCK}

STYLE:
- Premium cinematic 3D animation render (similar to high-end animated film).
- Glossy, polished finish. Clean and professional.
- Do NOT exaggerate or caricature faces.

BACKGROUND REPLACEMENT:
- Elegant stage-style floral backdrop with large pink and coral roses.
- Hanging decorative flower garlands and silk ribbons.
- Soft pink and coral volumetric lighting with warm spotlight glow behind the group.
- Subtle floating confetti particles and golden sparkles.
- Tasteful decorative heart and floral accents — elegant, not childish.

COMPOSITION:
- Vertical hero poster format.
- All people centered and clearly visible.
- Balanced, harmonious arrangement.

LIGHTING:
- Cinematic contrast with soft rim light.
- Warm spotlight from above-behind for glow effect.

MOOD:
- Festive, warm, premium, joyful.

OUTPUT:
- 4K vertical, social-media ready.
- Consistent 3D animated style throughout.`,

  3: `Transform this family photo into a vintage film-style Mother's Day portrait with warm analog tones.
${GROUP_LOCK}
${LOGO_BLOCK}

STYLE:
- Vintage analog film photography aesthetic.
- Film grain texture, subtle light fade at edges, gentle vignetting.
- Warm golden-amber colorcast throughout.
- Soft, nostalgic, timeless quality.

BACKGROUND REPLACEMENT:
- Elegant outdoor garden party setting.
- Vintage floral arrangements: peonies, wildflowers, garden roses.
- Warm fairy lights strung above.
- Pastel fabric bunting in the background.
- Soft afternoon golden hour light filtering through foliage.

CLOTHING & SUBJECTS:
- Keep clothing and body proportions fully recognizable.
- Allow gentle color harmonization to warm vintage palette.
- Maintain full body or waist-up visibility as in original.

COMPOSITION:
- Vertical format.
- Everyone fully visible, natural and candid feel.

LIGHTING:
- Warm golden hour sunlight.
- Soft backlight creating gentle rim glow on subjects.

MOOD:
- Nostalgic, romantic, timeless, deeply personal.

OUTPUT:
- 4K vertical, poster-ready.
- Consistent vintage film style throughout.`,
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
        'google/nano-banana',
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
