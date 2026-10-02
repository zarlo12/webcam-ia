import "./Resultado.scss";
import Pantalla from "../../components/Pantalla/Pantalla";
import { Boton, BotonAtras } from "../../components/ui/BotonDT";

interface ResultadoProps {
  imageUrl: string;
  onSiguiente: () => void;
  onReiniciar: () => void;
}

/**
 * Pantalla 4 — el póster generado.
 *
 * La plantilla ya trae titular, badge y logos, así que lo que devuelve la IA se
 * muestra tal cual: es exactamente lo que se descarga por QR.
 */
const Resultado = ({ imageUrl, onSiguiente, onReiniciar }: ResultadoProps) => (
  <Pantalla
    titulo={
      <>
        Su póster está <em>listo</em>
      </>
    }
    className="dt-resultado"
    footer={
      <>
        <BotonAtras onClick={onReiniciar}>Otra foto</BotonAtras>
        <Boton onClick={onSiguiente}>Descargar</Boton>
      </>
    }
  >
    <img className="dt-resultado__poster" src={imageUrl} alt="Su póster generado" />
  </Pantalla>
);

export default Resultado;
