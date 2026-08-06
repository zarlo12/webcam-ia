"use strict";
/**
 * Configuración de la campaña "Antioquia nos enseña a llegar lejos" (Claro / Feria de las Flores).
 *
 * Este archivo es el dueño de la relación filtro → plantilla → prompt.
 * El frontend solo manda `filtro: 1 | 2 | 3`, así nunca se puede desincronizar
 * la plantilla que se le adjunta al modelo con el prompt que la describe.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFeriaFilterId = exports.FERIA_FILTERS = exports.FERIA_ASPECT_RATIO = exports.FERIA_MODEL = exports.FERIA_COLLECTION = exports.FERIA_STORAGE = void 0;
/** Carpetas de Storage y colección de Firestore — namespaced para no chocar con otros proyectos. */
exports.FERIA_STORAGE = {
    originals: "feria-colombia/originales",
    generated: "feria-colombia/generadas",
};
exports.FERIA_COLLECTION = "feria_colombia_participantes";
/** Modelo de Replicate. Las plantillas son 3:4 (2050×2732 y 1025×1366). */
exports.FERIA_MODEL = "google/nano-banana-2";
exports.FERIA_ASPECT_RATIO = "3:4";
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

MENTAL MODEL FOR THIS TASK:
Do not "paint a new person inspired by the photo". Think of it as CUTTING OUT the visitor's real head from IMAGE 2 and COMPOSITING it into the poster, then only relighting it and re-texturing it so it matches the poster's light and technique. The head that comes out must be the same head that went in.

COPY FROM IMAGE 1 — 100% UNCHANGED, THIS IS THE HARD REQUIREMENT:
- The exact same composition, crop, framing and camera distance, and the same scale and position of the subject inside the frame.
- Every decorative element, in the same place: flowers, leaves, floral frames and arches, Antioquia landmarks, sun, sky, background.
- All text, character for character, with the same typeface, size, colour, curvature and position: "Antioquia nos enseña a llegar lejos". Do not re-letter, translate, re-spell, move or resize it.
- The Claro logo exactly as it appears: same shape, red, position, size and treatment. Never redraw it, never move it, never duplicate it, never invent additional logos, badges, captions or watermarks.
- The same colour palette, lighting direction, contrast, grain and artistic technique.
- The clothing of IMAGE 1 — EXCEPT where the wardrobe rule below says otherwise.

THE HEAD, THE FACE AND THE EXPRESSION COME FROM IMAGE 2 — NEVER FROM IMAGE 1:
This section OVERRIDES anything that could be read as "copy the pose of the model".
- KEEP THE HEAD EXACTLY AS PHOTOGRAPHED: the same head angle and rotation, the same tilt, the same chin height, the same direction of gaze, and the same distance and perspective of the face. If the visitor faces the camera straight on, the output faces the camera straight on — even if the model in IMAGE 1 is looking up, sideways or over the shoulder. NEVER turn, tilt, rotate or re-angle the head to imitate IMAGE 1.
- KEEP THE EXPRESSION EXACTLY AS PHOTOGRAPHED: if the visitor is not smiling, the output does not smile. If the mouth is closed, it stays closed. If the smile is small, it stays small. Do not open the mouth, do not show teeth that are not visible in the photo, do not widen the eyes, do not raise the eyebrows, do not add a "friendlier" face. The model's expression in IMAGE 1 is irrelevant.
- The shoulders and body adapt naturally to the head as photographed. A believable neck and shoulder line matters more than reproducing the model's pose. If the model in IMAGE 1 has a raised hand or a gesture that no longer fits the visitor's head position, leave that hand out rather than forcing the head to match it.

IDENTITY LOCK — the output face must be measurably the same face as IMAGE 2:
- Same facial proportions: width-to-height ratio of the face, distance between the eyes, length and width of the nose, thickness of the lips, height of the forehead, shape of the jaw and chin, shape and position of the ears.
- Same eyes: shape, size, slant, eyelid fold, iris colour.
- Same eyebrows: thickness, shape and position.
- Same skin: exact tone — never lighter or darker — plus moles, freckles, scars, dimples, wrinkles and skin texture. Do not smooth or clear the skin.
- Same hair: colour, texture, curl, length and hairline.
- Same facial hair as the photo: if there is a beard or moustache, keep it exactly; if there is none, never add one, not even light stubble.
- Same apparent age and gender, same body build.
- Eyeglasses only if the visitor is wearing them, with the same frame shape.
TEST: if the output face were laid on top of the face in IMAGE 2, the eyes, nose and mouth would line up. A relative of the visitor must recognise them instantly, without hesitation.

FLORAL FACE ART — KEEP IT, IT IS PART OF THE CAMPAIGN:
The model in IMAGE 1 wears small flowers and petals painted on the skin near the eye, cheekbone and temple. The visitor must get that decoration too — it is a signature of the campaign, not something to drop.
But it is strictly a LAYER ON TOP of the unchanged face, like festival face paint or stickers pressed onto the skin:
- The flowers follow the contours and volume of the visitor's real face, at the same place and roughly the same size as in IMAGE 1, scaled to the visitor's face.
- They NEVER reshape, widen, narrow, lift or hide the eyes, eyebrows, nose, mouth, cheekbones or jaw underneath, and they never become makeup that changes the look of the face.
- They must not cover more skin than in IMAGE 1, and they must not be placed over the eyes or lips.
- If the visitor wears glasses, the flowers go around the frame, never on top of it.
Removing the flowers is a mistake; letting the flowers alter the face is a bigger mistake.

WARDROBE AND ACCESSORIES — THIS RULE OVERRIDES "COPY THE CLOTHING FROM IMAGE 1":
The model in IMAGE 1 has a fixed gender, but the visitor may not share it. Garments and accessories must always suit the real person in IMAGE 2. NEVER dress a man in women's clothing or women's accessories, and never dress a woman in men's clothing.

IF THE PERSON IN IMAGE 2 IS A MAN, and the model in IMAGE 1 is a woman:
- REMOVE COMPLETELY: earrings of any kind, necklaces, chokers, pendants, bracelets, hair flowers, braided flower crowns, floral headbands, hair clips and any hair ornament; makeup, lipstick, tinted lips, blush, eyeshadow, eyeliner, mascara, false eyelashes; painted nails; and any blouse, dress, top or garment with ruffles, lace, puffed sleeves, floral embroidery, bare shoulders or a feminine neckline.
- REPLACE them with the male paisa equivalent, using the SAME colours, fabrics and level of detail so the poster's palette and richness do not change: a plain white men's shirt or guayabera with a normal collar, and — if the composition needs volume on the shoulders or chest — a woven Antioquian poncho/ruana or the leather strap of a "carriel".
- Where the woman wore a flower crown or floral hairpiece, put a traditional Antioquian straw hat (sombrero aguadeño / paisa, white or natural straw) with a small band of the SAME flowers, sized and placed so it fills the same area of the frame. The layout must not change.
- Keep his hair short and natural exactly as in IMAGE 2: never lengthen it, braid it, curl it or decorate it. Keep his beard, moustache or clean-shaven face exactly as in the photo.
- Masculine jawline, neck and shoulders. The output must read unmistakably as a man dressed as a paisa man.

IF THE PERSON IN IMAGE 2 IS A WOMAN, and the model in IMAGE 1 is a man:
- REMOVE any distinctly masculine element: never add a beard, moustache or stubble, and never broaden the jaw or shoulders beyond hers.
- Unisex garments (denim jacket, plain white t-shirt or shirt, woven jacket) stay as in IMAGE 1. Do not invent feminine accessories that are not present in IMAGE 1.

IF THE PERSON IN IMAGE 2 IS A CHILD: apply the same rule according to their gender, with age-appropriate garments, and never add makeup or jewellery.

IF THE GENDER IS AMBIGUOUS: choose the neutral option — no earrings, no makeup, no flower crown, a plain white shirt.

This wardrobe rule never affects the composition, the decoration, the flowers, the landmarks, the text or the logo. Only what the person wears.

STRICTLY FORBIDDEN:
- Do NOT re-pose the head, change the gaze direction, or change the expression. This is the most common failure: the visitor comes out smiling and looking sideways like the model. That is wrong.
- Do NOT beautify, slim, smooth, rejuvenate, age, or change the ethnicity or gender of the person.
- Do NOT "average" the visitor's face with the model's face. The model's face contributes NOTHING.
- Do NOT copy the background, lighting, framing or clothing of IMAGE 2 — only the person's identity travels.
- Do NOT add, remove or duplicate people. The output contains EXACTLY ONE person.
- Do NOT add new text, captions, borders, frames, signatures or watermarks.
- Do NOT crop the person's head or let any decoration cover their face.

IF IMAGE 2 SHOWS MORE THAN ONE PERSON: use only the person who is largest and closest to the centre of the frame, and ignore everyone else completely.
IF THE FACE IN IMAGE 2 IS PARTIALLY OCCLUDED OR POORLY LIT: reconstruct it faithfully from what is visible; never substitute a generic or invented face.`;
const OUTPUT_RULES = `OUTPUT: the complete poster, vertical 3:4, same resolution, sharpness and print quality as IMAGE 1. The only difference between IMAGE 1 and the output is WHO the person is.`;
exports.FERIA_FILTERS = {
    1: {
        id: 1,
        label: "Filtro 1",
        templateUrl: "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro1.jpg?alt=media&token=954653c3-d5f4-4d55-a4c2-991527e5735a",
        prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
In IMAGE 1 the model is a PHOTOREALISTIC WOMAN framed by an arch built out of real flowers arranged as a mosaic (silletero craft), with the Claro logo made of red flowers at the bottom and a curved flower banner with the campaign text at the top.
- Keep the new person's face and skin PHOTOREALISTIC, relit with the same soft studio lighting as the model — but with THEIR OWN head angle, gaze and expression from IMAGE 2. Do not copy the model's smile or the way she holds her head.
- The floral mosaic arch, the Antioquia landmarks inside it (antenna tower, Metrocable cabin, colonial church, Pueblito Paisa dome, bullring, chiva bus), the flower Claro logo and the flower banner must remain pixel-faithful to IMAGE 1.

WARDROBE FOR THIS TEMPLATE — the model is a woman, so read the visitor's gender first:
• IF THE VISITOR IS A WOMAN: keep everything as in IMAGE 1 — the earrings, the necklace and the embroidered white paisa blouse — and re-apply the delicate painted flower art (tiny daisies and petals) across the cheek and temple, adapted to the proportions of her face so it sits naturally on her features instead of looking pasted on.
  MANDATORY: she must also wear the braided flower crown of IMAGE 1, with the same flowers, the same width and in the same position on top of her head, filling the same area of the frame. This applies even if her hair in IMAGE 2 is short, straight or loose: the crown rests on her own hair, which keeps the length and texture of her photo. Never leave her head bare.
• IF THE VISITOR IS A MAN: no flower crown, no earrings, no necklace, no makeup, no embroidered or ruffled blouse. Instead:
  – A traditional Antioquian straw hat (sombrero aguadeño, natural or white straw) with a small band of the same flowers, placed where the flower crown was and filling the same area of the frame so the composition is identical.
  – A plain white men's paisa shirt with a normal collar, and optionally the woven strap of a leather "carriel" across the chest.
  – Short natural hair exactly as in his photo, and his facial hair exactly as in his photo.
  – On the face, only a very discreet trace of the campaign's floral art: two or three tiny flowers near the temple, no glitter, no petals across the cheek. Never full floral makeup.
  – He must read unmistakably as a paisa man, never as a woman.

${OUTPUT_RULES}`,
    },
    2: {
        id: 2,
        label: "Filtro 3",
        templateUrl: "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro2.jpg?alt=media&token=8a949548-c42c-4e8a-be36-8257713c6f42",
        prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
IMAGE 1 is a PHOTOGRAPH, not an illustration: a WOMAN among the fresh flowers of a silleta, on a vivid Claro-red backdrop, with the campaign headline at the top and the round Claro logo with "PUEDES TODO" at the bottom right.
- The output must stay fully PHOTOGRAPHIC. Natural skin texture with pores and real micro-detail, the same warm daylight, the same shallow depth of field and the same colour grade as IMAGE 1. Never stylise, paint, illustrate or 3D-render the face.
- CAREFUL WITH THIS TEMPLATE: the model looks upwards and sideways with a wide open smile and one hand near her hair. That is HER pose, not an instruction. The visitor keeps the head angle, gaze and expression of IMAGE 2 — most visitors will be looking straight at the camera, and that is correct. If the raised hand no longer makes sense with the visitor's head position, leave it out; the flowers already fill that area.
- The flowers, the bamboo silleta structure, the red backdrop with its neon flower outlines, the headline and the Claro logo stay exactly as in IMAGE 1.

WARDROBE FOR THIS TEMPLATE — the model is a woman, so read the visitor's gender first:
• IF THE VISITOR IS A WOMAN: keep the handmade flower earrings and the gold necklaces of IMAGE 1, and re-apply the small floral glitter and the tiny flowers near the eye, adapted to her face.
• IF THE VISITOR IS A MAN: no earrings, no necklaces, no makeup, no tinted lips, no glitter. Dress him in a plain white men's shirt or a simple white t-shirt with a normal neckline — never a bare-shouldered or ruffled garment — and keep his hair short and natural and his facial hair exactly as in his photo. He must read unmistakably as a man. He DOES keep the floral face art, in a restrained version: three or four small flowers on the cheekbone and temple, following the rules of the FLORAL FACE ART section, without glitter and without petals spreading across the face.

${OUTPUT_RULES}`,
    },
    3: {
        id: 3,
        label: "Filtro 2",
        templateUrl: "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/feria-colombia%2FFiltro3.jpg?alt=media&token=3a5a8edb-974b-4858-b1d0-198bbcf2a148",
        prompt: `${BASE_PROMPT}

HOW TO RENDER THE NEW FACE FOR THIS TEMPLATE:
IMAGE 1 is an edge-to-edge ARTWORK in which absolutely everything — including the model's skin, hair and clothes — is built from thousands of tiny packed flower petals and beads (a giant silleta mosaic).
- Render the new person's face, hair and neck with the SAME petal/bead mosaic texture, the same granularity, the same bead size and the same colour palette used for the model in IMAGE 1. The technique must be indistinguishable from the rest of the artwork.
- Even rendered as mosaic, the features must be unmistakably those of the person in IMAGE 2: keep their face shape, eyes, nose, mouth and hairline. Mosaic texture is a surface treatment, never an excuse to invent a generic face.
- Facial hair follows IMAGE 2, not IMAGE 1: if the person has no beard, render a clean-shaven mosaic face; if they do, render it in mosaic.

WARDROBE FOR THIS TEMPLATE — the model is a MAN, so read the visitor's gender first:
• IF THE VISITOR IS A MAN: keep the denim-and-woven jacket, the white shirt and the pendant exactly as in IMAGE 1.
• IF THE VISITOR IS A WOMAN: the denim-and-woven jacket, white shirt and pendant are unisex — keep them as they are, in the same mosaic technique. Do NOT add a beard, stubble or a masculine jaw, do not broaden her shoulders, and do not invent earrings, makeup or accessories that are not in IMAGE 1. Keep her hair as in her photo, rendered in mosaic.
- The denim-and-woven jacket, white shirt and pendant stay as in IMAGE 1, and so do all the flower-built landmarks (Claro antenna tower, Metrocable, colonial churches, Pueblito Paisa dome, bullring, chiva bus, paisa farmhouse, coffee cup, carriel bag, straw hat), the flower fields, the sun and the flower banner with the campaign text.

${OUTPUT_RULES}`,
    },
};
const isFeriaFilterId = (value) => value === 1 || value === 2 || value === 3;
exports.isFeriaFilterId = isFeriaFilterId;
//# sourceMappingURL=feria.js.map