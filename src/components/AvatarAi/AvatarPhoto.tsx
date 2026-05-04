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

const IDENTITY_BLOCK = `
IDENTITY PRESERVATION (MANDATORY — HIGHEST PRIORITY):
This is a photo-to-character transformation. The output MUST be instantly recognizable as the same individual from the input photo.
- Keep the EXACT face shape: jaw, cheekbones, forehead, chin
- Keep the EXACT skin tone and complexion (do not lighten, darken, or alter ethnicity)
- Keep the EXACT eye shape, color, and spacing
- Keep the EXACT nose shape and size
- Keep the EXACT lip shape
- Keep the EXACT hair color, texture, and length as shown in the photo
- Keep any distinctive features: beard, stubble, freckles, glasses, eyebrow shape, etc.
- A person who knows this individual must recognize them immediately in the final result
- Only change: clothing, armor, accessories, background, and overall art style
- Do NOT replace the face with a generic or idealized face
- Do NOT alter ethnicity, age, or gender presentation beyond the costume`;

const PROMPTS: Record<`${Gender}-${CharacterStyle}`, string> = {
  'mujer-guerrero': `Transform the uploaded photo of a real person into a powerful female fantasy warrior for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}

STYLE:
- High-end cinematic 3D render
- Clean, sharp, premium advertising look
- Red gradient studio background

CHARACTER:
- Strong female warrior, confident and dominant presence
- Fantasy armor (metal + leather), elegant but powerful
- Subtle glowing accents (red or cyan)
- Weapon: large sword or axe
- Heroic grounded pose (standing firm, facing camera or slight angle)

LIGHTING:
- Dramatic cinematic lighting
- Defined shadows, rim light for silhouette

MOOD:
- Power, confidence, leadership

QUALITY:
- Ultra detailed
- Clean render, no noise, no dirty textures`,

  'mujer-cyberpunk': `Transform the uploaded photo of a real person into a futuristic female cyberpunk character for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}

STYLE:
- Futuristic, high-end 3D render
- Clean sci-fi aesthetic (not grungy)
- Red studio background with subtle neon accents

CHARACTER:
- Female cyberpunk / techwear style
- Accessories: visor or high-tech glasses, headphones, light armor
- Mechanical or digital elements (jetpack or energy device)
- Neon accents (red + cyan)
- Dynamic pose (floating slightly or with energy effect)

LIGHTING:
- Soft cinematic lighting + neon glow accents
- Controlled reflections, very clean

MOOD:
- Innovation, intelligence, evolution

QUALITY:
- Ultra sharp, no noise, no distortion`,

  'hombre-guerrero': `Transform the uploaded photo of a real person into a powerful male fantasy warrior for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}

STYLE:
- Cinematic 3D render
- Premium advertising look
- Red gradient background

CHARACTER:
- Strong, battle-hardened warrior
- Heavy armor (metal, leather, engraved details)
- Large weapon (axe, hammer, or sword)
- Muscular or imposing silhouette
- Firm, grounded stance

LIGHTING:
- Dramatic contrast lighting
- Strong shadows, defined edges

MOOD:
- Strength, resilience, dominance

QUALITY:
- Ultra detailed
- Clean, polished render (no dirt, no noise)`,

  'hombre-cyberpunk': `Transform the uploaded photo of a real person into a futuristic male cyberpunk character for a campaign called "Unlock Your Power".
${IDENTITY_BLOCK}

STYLE:
- High-end sci-fi 3D render
- Clean, polished aesthetic
- Red background with neon lighting accents

CHARACTER:
- Futuristic outfit (techwear / cyber armor)
- Accessories: visor, augmented elements, jetpack or energy gear
- Subtle glowing lines (red + cyan)
- Confident, slightly dynamic pose (walking, floating, or ready stance)

LIGHTING:
- Cinematic lighting + neon highlights
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
        'google/nano-banana'
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
