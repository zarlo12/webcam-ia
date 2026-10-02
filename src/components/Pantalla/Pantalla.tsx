import type { ReactNode } from "react";
import "./Pantalla.scss";
import logo from "../../assets/datatech/logo.png";

interface PantallaProps {
  /** Titular. Lo que vaya en <em> sale en rojo, como en los pósters. */
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  /** Franja inferior con los controles. */
  footer?: ReactNode;
  /** El contenido ocupa todo el ancho, sin margen lateral. */
  aSangre?: boolean;
  className?: string;
}

/**
 * Armazón común de todas las pantallas.
 *
 * Esta activación no trae artes de pantalla: solo un fondo y las plantillas de
 * póster. Así que, al revés que en el Summit —donde el arte mandaba y el código
 * se limitaba a rellenar sus huecos—, aquí las pantallas se construyen en CSS
 * sobre ese fondo, con el logo de Claro media · DATA TECH arriba.
 */
const Pantalla = ({
  titulo,
  subtitulo,
  children,
  footer,
  aSangre,
  className,
}: PantallaProps) => (
  <div className={`pantalla${className ? ` ${className}` : ""}`}>
    <div className="pantalla__fondo" aria-hidden="true" />

    <header className="pantalla__cabecera">
      <img className="pantalla__logo" src={logo} alt="Claro media · DATA TECH" />
    </header>

    {/* El titular va DENTRO del cuerpo, no en la cabecera: así se centra junto
        al contenido en vez de quedar pegado arriba con un hueco en medio. */}
    <main className={`pantalla__cuerpo${aSangre ? " pantalla__cuerpo--sangre" : ""}`}>
      {titulo && <h1 className="pantalla__titulo">{titulo}</h1>}
      {subtitulo && <p className="pantalla__subtitulo">{subtitulo}</p>}
      <div className="pantalla__contenido">{children}</div>
    </main>

    {footer && <div className="pantalla__pie">{footer}</div>}
  </div>
);

export default Pantalla;
