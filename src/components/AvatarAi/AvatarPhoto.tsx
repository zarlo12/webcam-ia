import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";

import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

type Gender = 'hombre' | 'mujer';
type CharacterStyle = 'guerrero' | 'cyberpunk';

interface AvatarPhotoProps {
  gender: Gender;
  characterStyle: CharacterStyle;
  onProcess: () => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const BACKGROUND_URL =
  'https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/fondo_resultado.png?alt=media&token=49386813-9503-459c-ad91-7c81d96f6c76';

const IDENTITY_BLOCK = `
IDENTITY PRESERVATION (MANDATORY — HIGHEST PRIORITY):
This is a photo-to-character transformation. The person MUST be instantly recognizable in the final result.
Preserve these features but RENDER THEM IN THE ARTISTIC STYLE OF THE CHARACTER (cinematic 3D, not a realistic photo):
- Face structure: jaw, cheekbones, forehead, chin proportions
- Skin tone and complexion (adapted to the 3D render style, not photorealistic)
- Eye shape, color, and spacing
- Nose shape and size
- Lip shape
- Hair color, texture, and length
- Distinctive features: beard, stubble, freckles, glasses, eyebrow shape, etc.

CRITICAL STYLE RULE:
- The face MUST be rendered in the SAME cinematic 3D / artistic style as the rest of the character
- Do NOT paste a photorealistic face onto a stylized body — everything must be cohesive
- Think: "this person as a high-end video game character" — stylized but recognizable
- A person who knows this individual must recognize them in the final stylized render
- Do NOT replace the face with a generic face. Do NOT alter ethnicity or gender`;

const BACKGROUND_BLOCK = `
BACKGROUND & COMPOSITION (MANDATORY — ABSOLUTE RULES, NO EXCEPTIONS):

BACKGROUND RULES:
- Use the second image as the background EXACTLY as it is — same composition, same framing, same proportions, every pixel identical
- The background must be shown COMPLETELY: all four edges fully visible, nothing cropped, nothing cut, nothing zoomed in
- Do NOT pan, zoom, crop, reframe, recolor, or alter the background image in ANY way
- The bottom edge, top edge, left edge, and right edge of the background must all appear in the final image

CHARACTER RULES:
- The character is a SMALL figure placed on top of the background — like a figurine in a wide scene
- CHARACTER SIZE: the character height must be at most 35% of the total image height — very small relative to the scene
- CHARACTER POSITION: centered horizontally, standing in the lower third of the image (bottom 35% area)
- The character must NOT touch or go beyond the bottom edge of the image
- The character must NOT reach above the midpoint of the image
- All text, logos, and graphic elements in the background must remain 100% visible and unobstructed`;


const PROMPTS: Record<`${Gender}-${CharacterStyle}`, string> = {
  'mujer-guerrero': `Transform the uploaded photo of a real person into a powerful female fantasy warrior for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}
${BACKGROUND_BLOCK}

STYLE:
- High-end cinematic 3D render
- Clean, sharp, premium advertising look

CHARACTER:
- Strong female warrior, confident and dominant presence
- Fantasy armor (metal + leather), elegant but powerful
- Subtle glowing accents (red or cyan)
- Weapon: large sword or axe
- Heroic grounded pose (standing firm, facing camera or slight angle)

LIGHTING:
- Dramatic cinematic lighting adapted to the background scene
- Defined shadows, rim light for silhouette

MOOD:
- Power, confidence, leadership

QUALITY:
- Ultra detailed
- Clean render, no noise, no dirty textures`,

  'mujer-cyberpunk': `Transform the uploaded photo of a real person into a futuristic female cyberpunk character for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}
${BACKGROUND_BLOCK}

STYLE:
- Futuristic, high-end 3D render
- Clean sci-fi aesthetic (not grungy)

CHARACTER:
- Female cyberpunk / techwear style
- Accessories: visor or high-tech glasses, headphones, light armor
- Mechanical or digital elements (jetpack or energy device)
- Neon accents (red + cyan)
- Dynamic pose (floating slightly or with energy effect)

LIGHTING:
- Soft cinematic lighting + neon glow accents adapted to the background
- Controlled reflections, very clean

MOOD:
- Innovation, intelligence, evolution

QUALITY:
- Ultra sharp, no noise, no distortion`,

  'hombre-guerrero': `Transform the uploaded photo of a real person into a powerful male fantasy warrior for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}
${BACKGROUND_BLOCK}

STYLE:
- Cinematic 3D render
- Premium advertising look

CHARACTER:
- Strong, battle-hardened warrior
- Heavy armor (metal, leather, engraved details)
- Large weapon (axe, hammer, or sword)
- Muscular or imposing silhouette
- Firm, grounded stance

LIGHTING:
- Dramatic contrast lighting adapted to the background scene
- Strong shadows, defined edges

MOOD:
- Strength, resilience, dominance

QUALITY:
- Ultra detailed
- Clean, polished render (no dirt, no noise)`,

  'hombre-cyberpunk': `Transform the uploaded photo of a real person into a futuristic male cyberpunk character for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}
${BACKGROUND_BLOCK}

STYLE:
- High-end sci-fi 3D render
- Clean, polished aesthetic

CHARACTER:
- Futuristic outfit (techwear / cyber armor)
- Accessories: visor, augmented elements, jetpack or energy gear
- Subtle glowing lines (red + cyan)
- Confident, slightly dynamic pose (walking, floating, or ready stance)

LIGHTING:
- Cinematic lighting + neon highlights adapted to the background
- Clean reflections, no visual noise

MOOD:
- Power, speed, evolution

QUALITY:
- Ultra sharp
- No artifacts, no blur, no grunge`,
};

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  gender,
  characterStyle,
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

      const prompt = PROMPTS[`${gender}-${characterStyle}`];
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        'unlock-your-power',
        'user-' + Date.now(),
        'google/nano-banana',
        BACKGROUND_URL
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

  const styleLabel = characterStyle === 'guerrero' ? 'GUERRERO' : 'CYBERPUNK';
  const genderLabel = gender === 'mujer' ? 'MUJER' : 'HOMBRE';

  return (
    <div className="photo-container">
      <button onClick={toggleFullscreen} className="photo-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="photo-header">
        <img
          src="/referencias/titulo.png"
          alt="Desbloquea Tu Poder"
          className="photo-titulo-img"
        />
        <p className="photo-subtitle">es tu turno de jugar</p>
        <div className="photo-badge">{genderLabel} · {styleLabel}</div>
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
            {isProcessing ? 'PROCESANDO...' : 'CREAR PERSONAJE'}
          </button>
        </form>
      </div>

      <div className="photo-footer">
        <span>— Claro gaming —</span>
      </div>
    </div>
  );
};

export default AvatarPhoto;
