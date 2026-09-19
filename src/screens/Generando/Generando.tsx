import { useEffect, useState } from "react";
import "./Generando.scss";
import { BotonPantallaCompleta } from "../../components/ui/Boton";
import logo from "../../assets/summit/logo.png";

/**
 * Pantalla de espera.
 *
 * No viene en las artes de la campaña porque no es una pantalla del guion, pero
 * la generación tarda entre uno y tres minutos y sin ella el kiosco parece
 * colgado. Se construye en CSS con el mismo lenguaje: negro, rojo Claro y el
 * lockup del evento.
 */

const MENSAJES = [
  "Analizando su rostro",
  "Aplicando el estilo",
  "Componiendo la escena",
  "Afinando los detalles",
  "Ya casi está lista",
];

const CADA_MS = 4000;

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
    <div className="generando">
      <BotonPantallaCompleta />

      <img className="generando__logo" src={logo} alt="Claro Tech Summit 2026" />

      <div className="generando__anillo" aria-hidden="true">
        <span className="generando__anillo-capa generando__anillo-capa--1" />
        <span className="generando__anillo-capa generando__anillo-capa--2" />
        <span className="generando__anillo-capa generando__anillo-capa--3" />
      </div>

      <h1 className="generando__titulo">
        Generando <span>su imagen</span>
      </h1>
      <p className="generando__mensaje" role="status">
        {MENSAJES[paso]}
      </p>
      <p className="generando__nota">Esto puede tardar un par de minutos</p>

      <p className="generando__pie">Soluciones Digitales</p>
    </div>
  );
};

export default Generando;
