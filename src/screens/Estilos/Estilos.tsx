import { useState } from "react";
import "./Estilos.scss";
import { BotonAtras } from "../../components/ui/Boton";
import cabecera from "../../assets/summit/estilos-cabecera.png";
import pie from "../../assets/summit/soluciones-digitales.png";
import { cajaToStyle, ESTILOS, type FiltroId } from "../../config/summit";

interface EstilosProps {
  onElegir: (filtro: FiltroId) => void;
  onAtras: () => void;
}

/** Pausa para que se vea la tarjeta marcada antes de cambiar de pantalla. */
const RETARDO_MS = 280;

/**
 * Pantalla 2 — elección de estilo.
 *
 * Única pantalla que no usa Stage: no tiene un arte propio. El mockup
 * (paso_2.jpeg) trae las cuatro tarjetas dibujadas dentro y su resplandor rojo
 * invade toda la banda central, así que no sirve de fondo. En su lugar se
 * arma por partes —cabecera del mockup, tarjetas reales en alta, y el pie de
 * paso_3— sobre negro, que es el fondo de toda la campaña.
 */
const Estilos = ({ onElegir, onAtras }: EstilosProps) => {
  const [elegido, setElegido] = useState<FiltroId | null>(null);

  const elegir = (filtro: FiltroId) => {
    if (elegido) return;
    setElegido(filtro);
    window.setTimeout(() => onElegir(filtro), RETARDO_MS);
  };

  return (
    <div className="estilos">
      <img className="estilos__cabecera" src={cabecera} alt="Elija su estilo" />

      <div className="estilos__zona">
        <div className="estilos__grid">
          {ESTILOS.map((estilo) => (
            <button
              key={estilo.id}
              type="button"
              className={`estilos__tarjeta${elegido === estilo.id ? " estilos__tarjeta--elegida" : ""}`}
              style={cajaToStyle(estilo.caja)}
              onClick={() => elegir(estilo.id)}
              disabled={elegido !== null}
              aria-label={`Elegir estilo ${estilo.label}`}
            >
              <img src={estilo.tarjeta} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </div>

      <img className="estilos__pie" src={pie} alt="Soluciones Digitales" />

      <div className="estilos__controles">
        <BotonAtras onClick={onAtras} disabled={elegido !== null} />
      </div>
    </div>
  );
};

export default Estilos;
