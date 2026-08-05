import type { StyleChoice } from './App';
import filtro1 from './assets/claro/filtro1.jpeg';
import filtro2 from './assets/claro/filtro2.jpeg';
import filtro3 from './assets/claro/filtro3.jpeg';

export interface FilterOption {
  id: StyleChoice;
  label: string;
  preview: string;
}

/**
 * Orden y rótulos calcados de referencias/pantalla3.jpeg:
 * izquierda "Filtro 1", centro "Filtro 3", derecha "Filtro 2".
 *
 * `id` es el estilo interno (1 = filtro1.jpeg, 2 = filtro2.jpeg, 3 = filtro3.jpeg)
 * y define qué prompt se usa. `label` es solo el texto visible, así que se puede
 * renombrar o reordenar el arreglo sin tocar la lógica.
 */
export const FILTERS: FilterOption[] = [
  { id: 1, label: 'Filtro 1', preview: filtro1 },
  { id: 2, label: 'Filtro 3', preview: filtro2 },
  { id: 3, label: 'Filtro 2', preview: filtro3 },
];
