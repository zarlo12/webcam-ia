import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./Webcam.scss";

export interface WebcamHandle {
  /** Devuelve exactamente el encuadre que se está viendo, en JPEG. */
  capture: () => Promise<Blob>;
}

/** Lado mayor de la foto que se manda al modelo. */
const LADO_MAYOR = 1600;

/**
 * Se piden resoluciones de mayor a menor: algunas webcams de Windows rechazan
 * `facingMode` y otras no llegan a 1080p, y sin esta escalera la cámara
 * simplemente no arranca.
 */
const INTENTOS: MediaStreamConstraints[] = [
  { video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" } },
  { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
  { video: true },
];

const abrirCamara = async (): Promise<MediaStream> => {
  let ultimoError: unknown;

  for (const constraints of INTENTOS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError instanceof Error ? ultimoError : new Error("No se pudo abrir la cámara");
};

/**
 * Vista de la cámara.
 *
 * Llena su contenedor con `object-fit: cover`, y la captura repite ese mismo
 * recorte: lo que el visitante ve dentro del marco es lo que se manda al
 * modelo. La vista previa va espejada (uno se encuadra mejor viéndose como en
 * un espejo) pero la captura no, para que ningún texto de la ropa salga al
 * revés en la imagen final.
 */
const Webcam = forwardRef<WebcamHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelado = false;

    abrirCamara()
      .then((s) => {
        if (cancelado) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((e) => {
        console.error("No se pudo acceder a la cámara:", e);
        if (!cancelado) setError("No se pudo acceder a la cámara");
      });

    return () => {
      cancelado = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) {
        throw new Error("La cámara todavía no está lista");
      }

      const { width: cajaAncho, height: cajaAlto } = video.getBoundingClientRect();
      const proporcion = cajaAncho / cajaAlto;

      // Mismo recorte que hace `object-fit: cover` en pantalla.
      let ancho = video.videoWidth;
      let alto = video.videoHeight;
      if (ancho / alto > proporcion) {
        ancho = alto * proporcion;
      } else {
        alto = ancho / proporcion;
      }
      const x = (video.videoWidth - ancho) / 2;
      const y = (video.videoHeight - alto) / 2;

      const escala = LADO_MAYOR / Math.max(ancho, alto);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(ancho * escala);
      canvas.height = Math.round(alto * escala);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar la captura");

      ctx.drawImage(video, x, y, ancho, alto, 0, 0, canvas.width, canvas.height);

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la foto"))),
          "image/jpeg",
          0.95,
        );
      });
    },
  }));

  return (
    <div className="webcam">
      <video ref={videoRef} className="webcam__video" autoPlay playsInline muted />
      {error && <p className="webcam__error">{error}</p>}
    </div>
  );
});

Webcam.displayName = "Webcam";

export default Webcam;
