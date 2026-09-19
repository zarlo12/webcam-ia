import type { ButtonHTMLAttributes } from "react";
import "./Boton.scss";
import useFullscreen from "../../hooks/useFullscreen";

type Variante = "rojo" | "fantasma";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

/** Botón de la franja de controles. El arte no los trae, así que van en CSS. */
export const Boton = ({
  variante = "rojo",
  className,
  type = "button",
  ...props
}: BotonProps) => (
  <button
    type={type}
    className={`boton boton--${variante}${className ? ` ${className}` : ""}`}
    {...props}
  />
);

/** Botón de atrás, con la flecha ya puesta. */
export const BotonAtras = ({ children = "Atrás", ...props }: BotonProps) => (
  <Boton variante="fantasma" {...props}>
    <span aria-hidden="true">‹</span>
    {children}
  </Boton>
);

/**
 * Pantalla completa. Vive fuera del lienzo porque es una herramienta del
 * operador del kiosco, no parte del flujo del visitante.
 */
export const BotonPantallaCompleta = () => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      type="button"
      className="boton-pantalla-completa"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
    >
      ⛶
    </button>
  );
};
