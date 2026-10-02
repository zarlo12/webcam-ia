import { useRef, useState } from "react";
import "./Camara.scss";
import Pantalla from "../../components/Pantalla/Pantalla";
import Webcam, { type WebcamHandle } from "../../components/Webcam/Webcam";
import { Boton, BotonAtras } from "../../components/ui/BotonDT";

interface CamaraProps {
  onCapturar: (foto: Blob) => void;
  onAtras: () => void;
}

/** Pantalla 3 — la cámara. */
const Camara = ({ onCapturar, onAtras }: CamaraProps) => {
  const webcamRef = useRef<WebcamHandle>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState("");
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
    <Pantalla
      titulo={
        <>
          Tome su <em>foto</em>
        </>
      }
      subtitulo={
        foto
          ? "¿Quedó bien? Puede repetirla si quiere"
          : "Mire al frente, con buena luz y sin gafas de sol"
      }
      className="dt-camara"
      footer={
        foto ? (
          <>
            <BotonAtras onClick={repetir}>Repetir</BotonAtras>
            <Boton onClick={() => onCapturar(foto)}>Crear mi póster</Boton>
          </>
        ) : (
          <>
            <BotonAtras onClick={onAtras} />
            <Boton onClick={tomarFoto}>Tomar foto</Boton>
          </>
        )
      }
    >
      <div className="dt-camara__marco">
        {vistaPrevia ? (
          <img src={vistaPrevia} alt="Foto tomada" className="dt-camara__captura" />
        ) : (
          <Webcam ref={webcamRef} />
        )}
        <span className="dt-camara__esquina dt-camara__esquina--si" />
        <span className="dt-camara__esquina dt-camara__esquina--sd" />
        <span className="dt-camara__esquina dt-camara__esquina--ii" />
        <span className="dt-camara__esquina dt-camara__esquina--id" />
      </div>

      {error && (
        <p className="dt-camara__error" role="alert">
          {error}
        </p>
      )}
    </Pantalla>
  );
};

export default Camara;
