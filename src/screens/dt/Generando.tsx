import { useEffect, useState } from "react";
import "./Generando.scss";
import Pantalla from "../../components/Pantalla/Pantalla";

const MENSAJES = [
  "Analizando su rostro",
  "Montándolo en el póster",
  "Ajustando luces y vestuario",
  "Revisando los textos",
  "Ya casi está listo",
];

const CADA_MS = 4000;

/** Pantalla de espera: la generación tarda entre 15 s y un par de minutos. */
const Generando = () => {
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPaso((p) => Math.min(p + 1, MENSAJES.length - 1)),
      CADA_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <Pantalla
      titulo={
        <>
          Creando su <em>póster</em>
        </>
      }
      className="dt-generando"
    >
      <div className="dt-generando__anillo" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <p className="dt-generando__mensaje" role="status">
        {MENSAJES[paso]}
      </p>
      <p className="dt-generando__nota">No cierre esta pantalla</p>
    </Pantalla>
  );
};

export default Generando;
