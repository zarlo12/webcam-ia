import { QRCodeSVG } from "qrcode.react";
import "./Qr.scss";
import Stage from "../../components/Stage/Stage";
import { Boton, BotonAtras } from "../../components/ui/Boton";
import arte from "../../assets/summit/qr.png";
import { cajaToStyle, PROPORCIONES, ZONAS } from "../../config/summit";

interface QrProps {
  imageUrl: string;
  onAtras: () => void;
  onReiniciar: () => void;
}

/**
 * Pantalla 5 — el QR de descarga.
 *
 * Apunta a la URL pública de la imagen en Storage: el visitante la abre con la
 * cámara del celular y la guarda desde el navegador. El recuadro del arte es
 * transparente, así que el código va en la capa de atrás y el marco lo encuadra.
 */
const Qr = ({ imageUrl, onAtras, onReiniciar }: QrProps) => (
  <Stage
    art={arte}
    ratio={PROPORCIONES.qr}
    className="qr"
    behind={
      <div className="qr__recuadro" style={cajaToStyle(ZONAS.qr.codigo)}>
        <QRCodeSVG
          value={imageUrl}
          className="qr__codigo"
          level="M"
          marginSize={1}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
    }
    footer={
      <>
        <BotonAtras onClick={onAtras}>Ver mi imagen</BotonAtras>
        <Boton onClick={onReiniciar}>Terminar</Boton>
      </>
    }
  />
);

export default Qr;
