import "./Resultado.scss";
import Stage from "../../components/Stage/Stage";
import { Boton, BotonAtras } from "../../components/ui/Boton";
import { PROPORCIONES } from "../../config/summit";

interface ResultadoProps {
  imageUrl: string;
  onSiguiente: () => void;
  onReiniciar: () => void;
}

/**
 * Pantalla 4 — la imagen generada.
 *
 * El backend ya devuelve la foto montada dentro del marco de la campaña (mismo
 * arte, misma silueta), así que aquí se muestra tal cual: lo que se ve es
 * exactamente lo que se descarga por QR. Por eso la imagen entra como arte del
 * lienzo en vez de componerse otra vez en CSS.
 */
const Resultado = ({ imageUrl, onSiguiente, onReiniciar }: ResultadoProps) => (
  <Stage
    art={imageUrl}
    ratio={PROPORCIONES.resultado}
    className="resultado"
    footer={
      <>
        <BotonAtras onClick={onReiniciar}>Nueva foto</BotonAtras>
        <Boton onClick={onSiguiente}>Descargar</Boton>
      </>
    }
  />
);

export default Resultado;
