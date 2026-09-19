import type { CSSProperties } from "react";
import tarjeta1 from "../assets/summit/estilos/tarjeta-1.png";
import tarjeta2 from "../assets/summit/estilos/tarjeta-2.png";
import tarjeta3 from "../assets/summit/estilos/tarjeta-3.png";
import tarjeta4 from "../assets/summit/estilos/tarjeta-4.png";

/**
 * Configuración de pantalla de Claro Tech Summit 2026.
 *
 * Aquí viven dos cosas y nada más:
 *   · el catálogo de estilos que se pinta en la pantalla de selección,
 *   · las coordenadas de los huecos de cada arte.
 *
 * Las artes son PNG con transparencia sobre negro: el arte trae el texto, los
 * marcos y la decoración, y deja libre el espacio donde va el contenido vivo
 * (campos, cámara, foto, QR). Esas coordenadas están en % del lienzo del arte,
 * medidas con scripts/prepare-summit-assets.py, así que el contenido cae en su
 * sitio en cualquier tamaño de pantalla.
 *
 * Si diseño entrega artes nuevas: correr el script y actualizar este archivo.
 * Ningún componente tiene coordenadas propias.
 */

export type FiltroId = 1 | 2 | 3 | 4;

export interface Caja {
  /** Todos en % del lienzo del arte. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Estilo {
  id: FiltroId;
  /** Solo para lectores de pantalla y logs: el rótulo va pintado en la tarjeta. */
  label: string;
  tarjeta: string;
  caja: Caja;
}

/**
 * Las cuatro tarjetas venían como capas de pantalla completa de un mismo
 * lienzo de 1131×1391. El script las recorta a su caja real y estas son sus
 * posiciones dentro de ese lienzo.
 */
export const ESTILOS: Estilo[] = [
  {
    id: 1,
    label: "Acuarela",
    tarjeta: tarjeta1,
    caja: { left: 6.54, top: 2.23, width: 42.18, height: 42.2 },
  },
  {
    id: 2,
    label: "Ilustración",
    tarjeta: tarjeta2,
    caja: { left: 50.84, top: 2.23, width: 42.18, height: 42.2 },
  },
  {
    id: 3,
    label: "Universo Fantástico",
    tarjeta: tarjeta3,
    caja: { left: 6.72, top: 46.15, width: 42.26, height: 45.51 },
  },
  {
    id: 4,
    label: "Cyberpunk",
    tarjeta: tarjeta4,
    caja: { left: 50.84, top: 46.37, width: 42.18, height: 45.51 },
  },
];

/**
 * Proporción (ancho/alto) de cada arte, para que el lienzo no la deforme.
 * La pantalla de estilos no aparece: no tiene un arte único (ver Estilos.tsx).
 */
export const PROPORCIONES = {
  registro: 1123 / 1401,
  camara: 941 / 1672,
  resultado: 1123 / 1401,
  qr: 941 / 1672,
} as const;

/**
 * Huecos de cada arte, en % de su lienzo.
 * Los consume el SCSS de cada pantalla vía variables CSS (ver Stage).
 */
export const ZONAS = {
  /** registro.png — los cuatro campos dibujados, de arriba abajo. */
  registro: {
    campos: [32.83, 39.69, 46.4, 53.03],
    campoAlto: 5.35,
    /** El texto arranca después del icono rojo de cada campo. */
    campoTexto: { left: 26.6, width: 52.7 },
    casilla: { left: 22.26, top: 61.31, width: 5.43, height: 4.36 },
    /** Todo el párrafo: funciona como etiqueta de la casilla. */
    aviso: { left: 28.5, top: 60.6, width: 50, height: 7.2 },
    /** Las dos líneas subrayadas del párrafo abren la política. */
    politica: [
      { left: 46.8, top: 63.2, width: 26.5, height: 2.5 },
      { left: 28.6, top: 65.6, width: 9.6, height: 2.5 },
    ],
    boton: { left: 24.5, top: 69.24, width: 51, height: 6.7 },
    /** El arte no trae ranura de error; esta es la franja libre bajo el botón. */
    error: { left: 18, top: 76.4, width: 64, height: 3.6 },
  },
  /** camara.png — la ventana del marco de escaneo. */
  camara: {
    ventana: { left: 12, top: 24.4, width: 76, height: 38.2 },
  },
  /** qr.png — el recuadro interior del marco del código. */
  qr: {
    codigo: { left: 34.01, top: 38.94, width: 32.2, height: 17.52 },
  },
} as const;

/** Convierte una caja del catálogo en estilos absolutos dentro de su lienzo. */
export const cajaToStyle = (caja: Caja): CSSProperties => ({
  left: `${caja.left}%`,
  top: `${caja.top}%`,
  width: `${caja.width}%`,
  height: `${caja.height}%`,
});
