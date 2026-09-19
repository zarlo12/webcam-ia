import type { CSSProperties, ReactNode } from "react";
import "./Stage.scss";

interface StageProps {
  /** Arte de la pantalla: PNG/JPG con la decoración y el texto ya pintados. */
  art: string;
  /** Proporción ancho/alto del arte, para centrarlo sin deformarlo. */
  ratio: number;
  /** Capas que van DEBAJO del arte: cámara, foto generada, QR. */
  behind?: ReactNode;
  /** Capas que van ENCIMA del arte: campos, botones. */
  children?: ReactNode;
  /** Franja negra bajo el arte para los controles que el arte no trae. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Lienzo común de todas las pantallas.
 *
 * Las artes de esta activación son transparencias sobre negro con el contenido
 * vivo ya "recortado" (la ventana de la cámara, la silueta del retrato, el
 * recuadro del QR). Stage las centra respetando su proporción y ofrece un
 * sistema de coordenadas: cualquier hijo posicionado en % cae exactamente sobre
 * el hueco que le corresponde, en cualquier tamaño de pantalla.
 *
 * El tamaño se calcula con min() sobre unidades de viewport en vez de dejar que
 * el contenido lo defina, porque el lienzo declara `container-type: size` y así
 * las pantallas pueden dimensionar su texto con unidades `cq*`: todo escala con
 * el arte, no con la ventana.
 */
const Stage = ({
  art,
  ratio,
  behind,
  children,
  footer,
  className,
}: StageProps) => (
  <div
    className={`stage${footer ? " stage--con-footer" : ""}${className ? ` ${className}` : ""}`}
  >
    <div className="stage__viewport">
      <div className="stage__board" style={{ "--stage-ratio": ratio } as CSSProperties}>
        {behind && <div className="stage__capa stage__capa--fondo">{behind}</div>}
        <img className="stage__art" src={art} alt="" draggable={false} />
        {children && <div className="stage__capa stage__capa--frente">{children}</div>}
      </div>
    </div>
    {footer && <div className="stage__footer">{footer}</div>}
  </div>
);

export default Stage;
