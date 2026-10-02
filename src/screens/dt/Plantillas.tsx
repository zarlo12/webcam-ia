import { useState } from "react";
import "./Plantillas.scss";
import Pantalla from "../../components/Pantalla/Pantalla";
import { BotonAtras } from "../../components/ui/BotonDT";
import { PLANTILLAS, type PlantillaId } from "../../config/datatech";

interface PlantillasProps {
  onElegir: (plantilla: PlantillaId) => void;
  onAtras: () => void;
  /** Cambia cuando se entró desde el chat: allí "atrás" sale del kiosco. */
  textoAtras?: string;
}

/** Pausa para que se vea la tarjeta marcada antes de cambiar de pantalla. */
const RETARDO_MS = 280;

/** Pantalla 2 — elección del póster. */
const Plantillas = ({ onElegir, onAtras, textoAtras }: PlantillasProps) => {
  const [elegida, setElegida] = useState<PlantillaId | null>(null);

  const elegir = (id: PlantillaId) => {
    if (elegida) return;
    setElegida(id);
    window.setTimeout(() => onElegir(id), RETARDO_MS);
  };

  return (
    <Pantalla
      titulo={
        <>
          Elija su <em>póster</em>
        </>
      }
      subtitulo="Su rostro reemplazará al del modelo"
      className="dt-plantillas"
      footer={
        <BotonAtras onClick={onAtras} disabled={elegida !== null}>
          {textoAtras}
        </BotonAtras>
      }
    >
      <div className="dt-plantillas__grid">
        {PLANTILLAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`dt-plantilla${elegida === p.id ? " dt-plantilla--elegida" : ""}`}
            onClick={() => elegir(p.id)}
            disabled={elegida !== null}
            aria-label={`Elegir el póster ${p.palabra}: ${p.titular}`}
          >
            <img src={p.miniatura} alt="" draggable={false} loading="eager" />
            <span className="dt-plantilla__palabra">{p.palabra}</span>
          </button>
        ))}
      </div>
    </Pantalla>
  );
};

export default Plantillas;
