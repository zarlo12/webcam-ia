import { QRCodeSVG } from "qrcode.react";
import "./Qr.scss";
import Pantalla from "../../components/Pantalla/Pantalla";
import { Boton, BotonAtras } from "../../components/ui/BotonDT";

interface QrProps {
  imageUrl: string;
  onAtras: () => void;
  onReiniciar: () => void;
}

/**
 * Pantalla 5 — el QR de descarga.
 *
 * Apunta a la URL pública del póster en Storage: el visitante la abre con la
 * cámara del celular y lo guarda desde el navegador.
 */
const Qr = ({ imageUrl, onAtras, onReiniciar }: QrProps) => (
  <Pantalla
    titulo={
      <>
        Descargue su <em>póster</em>
      </>
    }
    subtitulo="Escanee el código con la cámara de su celular"
    className="dt-qr"
    footer={
      <>
        <BotonAtras onClick={onAtras}>Ver póster</BotonAtras>
        <Boton onClick={onReiniciar}>Terminar</Boton>
      </>
    }
  >
    <div className="dt-qr__caja">
      <QRCodeSVG
        value={imageUrl}
        className="dt-qr__codigo"
        level="M"
        marginSize={1}
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    </div>
    <p className="dt-qr__pie">El enlace queda disponible para guardarlo o compartirlo</p>
  </Pantalla>
);

export default Qr;
