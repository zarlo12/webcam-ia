import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const cropToSquare = (video: HTMLVideoElement, size = 1024): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('No canvas context')); return; }

    const { videoWidth: vw, videoHeight: vh } = video;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;

    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);

    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/jpeg',
      0.92
    );
  });
};

const WebcamScene = forwardRef<WebcamRef>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(console.error);

    return () => {
      // Liberar cámara al desmontar
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    captureImage: () => {
      const video = videoRef.current;
      if (!video) return Promise.reject(new Error('Video no disponible'));
      return cropToSquare(video);
    },
  }));

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline   // obligatorio para autoplay en iOS
      muted         // obligatorio para autoplay sin gesto en móvil
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        transform: 'scaleX(-1)', // efecto espejo natural para selfie
        pointerEvents: 'none',   // evita cualquier interacción táctil sobre el video
      }}
    />
  );
});

WebcamScene.displayName = 'WebcamScene';
export default WebcamScene;
