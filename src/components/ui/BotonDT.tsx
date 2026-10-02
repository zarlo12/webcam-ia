import type { ButtonHTMLAttributes } from "react";
import "./BotonDT.scss";
import useFullscreen from "../../hooks/useFullscreen";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "rojo" | "fantasma";
}

export const Boton = ({
  variante = "rojo",
  className,
  type = "button",
  ...props
}: BotonProps) => (
  <button
    type={type}
    className={`dt-boton dt-boton--${variante}${className ? ` ${className}` : ""}`}
    {...props}
  />
);

export const BotonAtras = ({ children = "Atrás", ...props }: BotonProps) => (
  <Boton variante="fantasma" {...props}>
    <span aria-hidden="true">‹</span>
    {children}
  </Boton>
);

/** Herramienta del operador del kiosco, no parte del flujo del visitante. */
export const BotonPantallaCompleta = () => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      type="button"
      className="dt-pantalla-completa"
      onClick={toggleFullscreen}
      title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
    >
      ⛶
    </button>
  );
};
