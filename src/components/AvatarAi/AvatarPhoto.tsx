import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";

import WebcamScene from "../WebcamScene";
import feriaService from "../../services/feriaService";
import Swal from "sweetalert2";
import { StyleChoice } from "../../App";
import type { RegistroData } from "../Registro/Registro";
import fondo from "../../assets/claro/fondo.jpeg";
import useFullscreen from "../../hooks/useFullscreen";

interface AvatarPhotoProps {
  styleChoice: StyleChoice;
  /** Datos de la pantalla de registro; se guardan junto con la foto generada. */
  registro: RegistroData | null;
  onProcess: () => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
  /** Regresa a la pantalla de filtros por si el usuario eligió mal o cambió de opinión. */
  onChangeFilter: () => void;
  /** Se llama si la generación falla, para no dejar al usuario esperando eternamente. */
  onError: (message: string) => void;
}

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({
  styleChoice,
  registro,
  onProcess,
  onAiImageReady,
  onChangeFilter,
  onError,
}) => {
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const webcamRef = useRef<WebcamRef | null>(null);

  const handleChangeFilter = async () => {
    if (isProcessing) return;
    // Si ya hay una foto tomada, confirmamos antes de descartarla.
    if (capturedImageUrl) {
      const { isConfirmed } = await Swal.fire({
        icon: 'question',
        title: '¿Cambiar de filtro?',
        text: 'Se descartará la foto que acabas de tomar.',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Seguir aquí',
        confirmButtonColor: '#E30613',
        cancelButtonColor: '#6B1018',
      });
      if (!isConfirmed) return;
    }
    onChangeFilter();
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

      // El backend elige la plantilla y el prompt a partir del filtro.
      const result = await feriaService.generate(capturedImage, styleChoice, registro);

      if (result.success && result.imageUrl) {
        onAiImageReady(result.imageUrl, originalImageDataUrl);
      } else {
        console.error('Error al generar imagen:', result.error);
        onError(result.error || 'No se pudo generar tu foto. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      onError('No se pudo generar tu foto. Inténtalo de nuevo.');
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

      <button
        type="button"
        className="photo-back-btn"
        onClick={handleChangeFilter}
        disabled={isProcessing}
      >
        <span aria-hidden="true">‹</span> Volver
      </button>

      <div className="photo-header">
        <h1 className="photo-title-main">Antioquia nos enseña<br />a llegar lejos</h1>
        <p className="photo-subtitle">Ubícate en el centro y toma tu foto</p>
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
