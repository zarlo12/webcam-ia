import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";

import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";
import { StyleChoice } from "../../App";
import { FILTER_LABELS } from "../../filters";
import fondo from "../../assets/claro/fondo.jpeg";
import useFullscreen from "../../hooks/useFullscreen";

interface AvatarPhotoProps {
  styleChoice: StyleChoice;
  userId?: string;
  onProcess: () => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

// TODO: reemplazar por una URL pública del logo Claro (esta es la del proyecto anterior).
const LOGO_URL =
  'https://replicate.delivery/pbxt/OgeG3mQ98GKDjIBB2PN0WUhQw8QmAJLgMN4Iad3lNMHhM86Z/LOGO.jpg';

// Guardas compartidas por los tres filtros (conteo de personas y encuadre).
const PEOPLE_RULES = `EXACT PEOPLE COUNT — CRITICAL:
Count the number of people in the first image. Reproduce ONLY those exact people — no more, no less.
Do NOT add, invent, generate, or hallucinate any additional person, figure, silhouette, or character that does not appear in the original photo.
If the photo has 1 person → final image has exactly 1 person. If 3 people → exactly 3 people. Never add extras. Never fill empty space with invented figures.

GROUP RULE — MANDATORY:
All people from the original photo must appear in the final image. Do NOT crop anyone. Do NOT merge faces. Extend the canvas if needed.
Preserve each person's facial identity, age, proportions and skin tone faithfully.`;

// === PROMPTS · CAMPAÑA "ANTIOQUIA NOS ENSEÑA A LLEGAR LEJOS" ===
// Cada prompt corresponde a una referencia: 1 → Filtro1.jpeg, 2 → Filtro2.jpeg, 3 → Filtro3.jpeg
const PROMPTS: Record<StyleChoice, string> = {
  1: `Use the first attached image as the photo reference and the second attached image as the brand logo.

${PEOPLE_RULES}

STYLE — SILLETERO FLOWER-MOSAIC FRAME (Feria de las Flores, Medellín):
Keep the person's face and skin PHOTOREALISTIC and clearly recognizable, only enhanced with soft studio light.
Add delicate painted flower art across one cheek and temple (tiny daisies and petals, like festival face paint) plus a lush braided flower crown of red, yellow, purple and white blooms.
Dress the person in a traditional Antioquian embroidered white blouse / paisa outfit with floral details.

FRAME — MANDATORY:
Surround the person with a tall arch made entirely of tightly packed real flowers and green leaves (silleta mosaic craft): red carnations, white daisies, yellow sunflowers, purple asters.
Inside that floral arch, built out of the same flower-mosaic texture, include these Antioquia icons: a red-and-white telecommunications antenna tower, a blue Medellín Metrocable cabin, a white colonial church with a red-tile roof, the Cerro Nutibara / Pueblito Paisa dome with a golden staircase, a bullring-style arched building, and a colorful "chiva" bus with the word "ANTIOQUIA".
Background behind the arch: flat vibrant Claro red.

BRANDING:
Top center, on a curved banner made of red flowers with a yellow petal border, the text "Antioquia nos enseña a llegar lejos" in white 3D flower lettering.
Bottom center: a large circular Claro logo built out of red flowers with a white petal ring, matching the second attached image.
Add a bright sun made of yellow petals in the upper right.

COMPOSITION: Vertical poster, person centered, waist-up, looking at the camera.
OUTPUT: 4K vertical, poster-quality, extremely detailed handcrafted flower-mosaic texture.`,

  2: `Use the first attached image as the photo reference and the second attached image as the brand logo.

${PEOPLE_RULES}

STYLE — REALISTIC FERIA DE LAS FLORES PORTRAIT:
This is a PHOTOGRAPHIC treatment, NOT an illustration. Faces stay photorealistic, natural and recognizable.
Warm bright daylight, vivid saturated color, shallow depth of field, editorial campaign look.
Add subtle floral glitter and a few tiny real flowers on one cheek near the eye, and small handmade flower earrings.

SCENE:
Place the people among the flowers of a real silleta: a huge dense arrangement of fresh flowers (dahlias, chrysanthemums, daisies, carnations) filling the lower half of the frame and rising behind them, with a rustic bamboo/wood silleta structure visible at one side.
Behind everything, a vibrant Claro red studio backdrop with a soft warm gradient and delicate neon-line flower outlines glowing in the corners.
Happy, joyful expressions, natural gesture (hand near the hair).

BRANDING:
Top area: the headline "Antioquia nos enseña a llegar lejos" in bold white sans-serif, with "Antioquia" largest, plus a small colorful hummingbird and a pink flower accent beside it.
Bottom right: the round red Claro logo from the second attached image with "PUEDES TODO" underneath in small white caps.

COMPOSITION: Vertical poster with rounded corners feel. People centered, chest-up, clearly visible.
OUTPUT: 4K vertical, photographic, warm, joyful, premium advertising quality.`,

  3: `Use the first attached image as the photo reference and the second attached image as the brand logo.

${PEOPLE_RULES}

STYLE — FULL FLOWER-MOSAIC ARTWORK (edge to edge):
Transform the ENTIRE image, including the people, into handcrafted flower-and-bead mosaic art: every surface is built from thousands of tiny packed petals, buds and beads, like a giant silleta of the Feria de las Flores.
Faces keep the exact likeness and structure of the original people, but their skin, hair and clothes are rendered with visible petal/bead mosaic texture. This is an artwork, not a photo filter.
Keep clothing recognizable (denim jacket, woven Antioquian textile patterns, white shirt) rendered in mosaic.

SCENE — MANDATORY ICONS, all made of flowers:
Fill the whole background with Antioquia landmarks built from flowers: a red-and-white antenna tower carrying a round red Claro sign, a blue Metrocable cabin on its cable, white colonial churches with red-tile roofs on green hills, the Cerro Nutibara / Pueblito Paisa dome with a golden zig-zag staircase, an arched bullring, a colorful "chiva" bus labeled "ANTIOQUIA", a paisa farmhouse with flower balconies, a cup of coffee, a leather carriel bag and a woven straw hat.
Dense fields of red, yellow, purple, pink and white flowers everywhere, with a bright sun of yellow petals.

BRANDING:
Top: a curved banner of red flowers with a yellow petal border reading "Antioquia nos enseña a llegar lejos" in white 3D flower lettering.

COMPOSITION: Vertical poster, people centered and dominant in the middle, waist-up.
OUTPUT: 4K vertical, hyper-detailed, saturated, handcrafted mosaic craft aesthetic.`,
};

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  styleChoice,
  userId,
  onProcess,
  onAiImageReady,
}) => {
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const webcamRef = useRef<WebcamRef | null>(null);

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
        'antioquia',
        userId ? `cc-${userId}` : 'user-' + Date.now(),
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
      <div className="photo-bg" style={{ backgroundImage: `url(${fondo})` }} />
      <div className="photo-veil" aria-hidden="true" />

      <button onClick={toggleFullscreen} className="photo-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="photo-header">
        <h1 className="photo-title-main">Antioquia nos enseña<br />a llegar lejos</h1>
        <p className="photo-subtitle">Ubícate en el centro y toma tu foto</p>
        <div className="photo-badge">{FILTER_LABELS[styleChoice]}</div>
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
            {isProcessing ? 'PROCESANDO...' : 'CREAR MI FOTO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AvatarPhoto;
