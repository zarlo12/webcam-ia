/**
 * Configuración de la campaña "Antioquia nos enseña a llegar lejos" (Claro / Feria de las Flores).
 *
 * Este archivo es el dueño de la relación filtro → plantilla → prompt.
 * El frontend solo manda `filtro: 1 | 2 | 3`, así nunca se puede desincronizar
 * la plantilla que se le adjunta al modelo con el prompt que la describe.
 */

export type FeriaFilterId = 1 | 2 | 3;

/** Carpetas de Storage y colección de Firestore — namespaced para no chocar con otros proyectos. */
export const FERIA_STORAGE = {
  originals: "feria-colombia/originales",
  generated: "feria-colombia/generadas",
} as const;

export const FERIA_COLLECTION = "feria_colombia_participantes";

/** Modelo de Replicate. Las plantillas son 3:4 (2050×2732 y 1025×1366). */
export const FERIA_MODEL = "google/nano-banana-2";
export const FERIA_ASPECT_RATIO = "3:4";

/**
 * Instrucciones comunes a los tres filtros.
 *
 * El orden de las imágenes importa: se envían como image_input = [plantilla, foto].
 * El prompt las nombra IMAGE 1 / IMAGE 2 en ese mismo orden.
 */
const BASE_PROMPT = `You are given EXACTLY TWO images, in this order:

IMAGE 1 = THE TEMPLATE. A finished campaign poster for "Antioquia nos enseña a llegar lejos" (Claro, Feria de las Flores, Antioquia, Colombia). It already contains a model, decoration, text and logo.
IMAGE 2 = THE VISITOR PHOTO. A webcam snapshot of a real person taken at an event booth.

TASK — REPLACE THE MODEL WITH THE REAL PERSON:
Reproduce IMAGE 1 exactly, but the model who appears in it must be replaced by the real person from IMAGE 2.
The result must look like the very same poster, re-shot with a different person. Nothing else about the poster changes.

COPY FROM IMAGE 1 — 100% UNCHANGED, THIS IS THE HARD REQUIREMENT:
- The exact same composition, crop, camera angle, scale and position of the subject.
- Every decorative element, in the same place: flowers, leaves, floral frames and arches, Antioquia landmarks, sun, sky, background.
- All text, character for character, with the same typeface, size, colour, curvature and position: "Antioquia nos enseña a llegar lejos". Do not re-letter, translate, re-spell, move or resize it.
- The Claro logo exactly as it appears: same shape, red, position, size and treatment. Never redraw it, never move it, never duplicate it, never invent additional logos, badges, captions or watermarks.
- The same colour palette, lighting direction, contrast, grain and artistic technique.
- The same pose, body position, shoulders, hands and clothing as the model in IMAGE 1.

TAKE FROM IMAGE 2 — THE PERSON'S IDENTITY, AND NOTHING ELSE:
- The face and head: face shape, bone structure, jawline, eyes, eyebrows, nose, mouth, lips, chin, cheeks, ears.
- The exact skin tone — do not lighten, darken or change it.
- Hair colour, texture and hairline.
- Facial hair exactly as in the photo: if the person has a beard or moustache, keep it; if not, do not add one.
- The apparent age and gender of the person in the photo.
- Eyeglasses only if the person is wearing them.
A relative of the person in IMAGE 2 must recognise them immediately in the output.

STRICTLY FORBIDDEN:
- Do NOT beautify, slim, smooth, rejuvenate, age, or change the ethnicity or gender of the person.
- Do NOT copy the background, lighting, framing or clothing of IMAGE 2 — only the person's identity travels.
- Do NOT add, remove or duplicate people. The output contains EXACTLY ONE person.
- Do NOT add new text, captions, borders, frames, signatures or watermarks.
- Do NOT crop the person's head or let any decoration cover their face.

IF IMAGE 2 SHOWS MORE THAN ONE PERSON: use only the person who is largest and closest to the centre of the frame, and ignore everyone else completely.
IF THE FACE IN IMAGE 2 IS PARTIALLY OCCLUDED OR POORLY LIT: reconstruct it faithfully from what is visible; never substitute a generic or invented face.`;

const OUTPUT_RULES = `OUTPUT: the complete poster, vertical 3:4, same resolution, sharpness and print quality as IMAGE 1. The only difference between IMAGE 1 and the output is WHO the person is.`;

export interface FeriaFilter {
  id: FeriaFilterId;
  /** Nombre visible en la web app (pantalla 3). */
  label: string;
  /** Plantilla que se adjunta al modelo. */
  templateUrl: string;
  prompt: string;
}

export const FERIA_FILTERS: Record<FeriaFilterId, FeriaFilter> = {
  1: {
    id: 1,
    label: "Filtro 1",
    templateUrl:
      "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro1.jpg?alt=media&token=954653c3-d5f4-4d55-a4c2-991527e5735a",
    prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
In IMAGE 1 the model is a PHOTOREALISTIC person framed by an arch built out of real flowers arranged as a mosaic (silletero craft), with the Claro logo made of red flowers at the bottom and a curved flower banner with the campaign text at the top.
- Keep the new person's face and skin PHOTOREALISTIC, with the same soft studio lighting, the same skin texture and the same gentle smile direction as the model.
- Re-apply the delicate painted flower art (tiny daisies and petals) across the cheek and temple, and the braided flower crown, adapting both to the proportions of the new face — the flower art must sit naturally on the new features, never as a flat copy-paste.
- Keep the earrings, the embroidered white paisa blouse and the necklace exactly as in IMAGE 1.
- The floral mosaic arch, the Antioquia landmarks inside it (antenna tower, Metrocable cabin, colonial church, Pueblito Paisa dome, bullring, chiva bus), the flower Claro logo and the flower banner must remain pixel-faithful to IMAGE 1.

${OUTPUT_RULES}`,
  },
  2: {
    id: 2,
    label: "Filtro 3",
    templateUrl:
      "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro2.jpg?alt=media&token=8a949548-c42c-4e8a-be36-8257713c6f42",
    prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
IMAGE 1 is a PHOTOGRAPH, not an illustration: a person among the fresh flowers of a silleta, on a vivid Claro-red backdrop, with the campaign headline at the top and the round Claro logo with "PUEDES TODO" at the bottom right.
- The output must stay fully PHOTOGRAPHIC. Natural skin texture with pores and real micro-detail, the same warm daylight, the same shallow depth of field and the same colour grade as IMAGE 1. Never stylise, paint, illustrate or 3D-render the face.
- Keep the same joyful expression, the same head tilt, the same hand near the hair and the same gaze direction as the model.
- Re-apply the small floral glitter and the tiny flowers near the eye, and keep the handmade flower earrings and the gold necklaces, adapted to the new face.
- The flowers, the bamboo silleta structure, the red backdrop with its neon flower outlines, the headline and the Claro logo stay exactly as in IMAGE 1.

${OUTPUT_RULES}`,
  },
  3: {
    id: 3,
    label: "Filtro 2",
    templateUrl:
      "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro3.jpg?alt=media&token=3a5a8edb-974b-4858-b1d0-198bbcf2a148",
    prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
IMAGE 1 is an edge-to-edge ARTWORK in which absolutely everything — including the model's skin, hair and clothes — is built from thousands of tiny packed flower petals and beads (a giant silleta mosaic).
- Render the new person's face, hair and neck with the SAME petal/bead mosaic texture, the same granularity, the same bead size and the same colour palette used for the model in IMAGE 1. The technique must be indistinguishable from the rest of the artwork.
- Even rendered as mosaic, the features must be unmistakably those of the person in IMAGE 2: keep their face shape, eyes, nose, mouth and hairline. Mosaic texture is a surface treatment, never an excuse to invent a generic face.
- Facial hair follows IMAGE 2, not IMAGE 1: if the person has no beard, render a clean-shaven mosaic face; if they do, render it in mosaic.
- The denim-and-woven jacket, white shirt and pendant stay as in IMAGE 1, and so do all the flower-built landmarks (Claro antenna tower, Metrocable, colonial churches, Pueblito Paisa dome, bullring, chiva bus, paisa farmhouse, coffee cup, carriel bag, straw hat), the flower fields, the sun and the flower banner with the campaign text.

${OUTPUT_RULES}`,
  },
};

export const isFeriaFilterId = (value: unknown): value is FeriaFilterId =>
  value === 1 || value === 2 || value === 3;
