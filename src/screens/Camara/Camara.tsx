import { useRef, useState } from "react";
import "./Camara.scss";
import Stage from "../../components/Stage/Stage";
import Webcam, { type WebcamHandle } from "../../components/Webcam/Webcam";
import { Boton, BotonAtras } from "../../components/ui/Boton";
import arte from "../../assets/summit/camara.png";
import { cajaToStyle, PROPORCIONES, ZONAS } from "../../config/summit";

interface CamaraProps {
  onCapturar: (foto: Blob) => void;
  onAtras: () => void;
}

/** Pantalla 3 — la cámara vive dentro del recuadro de escaneo del arte. */
const Camara = ({ onCapturar, onAtras }: CamaraProps) => {
  const webcamRef = useRef<WebcamHandle>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const tomarFoto = async () => {
    try {
      const blob = await webcamRef.current!.capture();
      setFoto(blob);
      setVistaPrevia((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return URL.createObjectURL(blob);
      });
      setError(null);
    } catch (e) {
      console.error("Error al capturar:", e);
      setError("No se pudo tomar la foto. Inténtelo de nuevo.");
    }
  };

  const repetir = () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia("");
    setFoto(null);
  };

  return (
    <Stage
      art={arte}
      ratio={PROPORCIONES.camara}
      className="camara"
      behind={
        <div className="camara__ventana" style={cajaToStyle(ZONAS.camara.ventana)}>
          {vistaPrevia ? (
            <img src={vistaPrevia} alt="Foto tomada" className="camara__captura" />
          ) : (
            <Webcam ref={webcamRef} />
          )}
        </div>
      }
      footer={
        foto ? (
          <>
            <BotonAtras onClick={repetir}>Repetir</BotonAtras>
            <Boton onClick={() => onCapturar(foto)}>Crear mi imagen</Boton>
          </>
        ) : (
          <>
            <BotonAtras onClick={onAtras} />
            <Boton onClick={tomarFoto}>Tomar foto</Boton>
          </>
        )
      }
    >
      {error && (
        <p className="camara__error" role="alert">
          {error}
        </p>
      )}
    </Stage>
  );
};

export default Camara;
