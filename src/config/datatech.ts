import plantilla1 from "../assets/datatech/plantillas/plantilla-1.jpg";
import plantilla2 from "../assets/datatech/plantillas/plantilla-2.jpg";
import plantilla3 from "../assets/datatech/plantillas/plantilla-3.jpg";
import plantilla4 from "../assets/datatech/plantillas/plantilla-4.jpg";
import plantilla5 from "../assets/datatech/plantillas/plantilla-5.jpg";

/**
 * Catálogo de pósters de Claro media · DATA TECH ("15 minutos").
 *
 * El `id` es lo único que viaja al backend; `palabra` y `titular` son solo
 * para la pantalla y los lectores de pantalla. El backend es dueño del prompt
 * y de la plantilla en alta, así que no se pueden desincronizar.
 *
 * A diferencia del Summit, aquí no hay artes de pantalla con huecos: las
 * pantallas se construyen en CSS sobre `fondo.jpg`, y las plantillas son
 * pósters completos que se muestran como miniaturas.
 */

export type PlantillaId = 1 | 2 | 3 | 4 | 5;

export interface Plantilla {
  id: PlantillaId;
  /** Palabra en 3D del póster; es como la reconoce el visitante. */
  palabra: string;
  titular: string;
  miniatura: string;
}

export const PLANTILLAS: Plantilla[] = [
  { id: 1, palabra: "DATA", titular: "Decido con data relevante", miniatura: plantilla1 },
  { id: 2, palabra: "CONECTO", titular: "Conecto alcance con intención", miniatura: plantilla2 },
  { id: 3, palabra: "INSIGHTS", titular: "Transformo insights en oportunidades", miniatura: plantilla3 },
  { id: 4, palabra: "AUDIENCIAS", titular: "Activo audiencias con precisión", miniatura: plantilla4 },
  { id: 5, palabra: "SEÑALES", titular: "Convierto señales en decisiones", miniatura: plantilla5 },
];

/** Proporción de los pósters (1080×1920). */
export const POSTER_RATIO = 1080 / 1920;
