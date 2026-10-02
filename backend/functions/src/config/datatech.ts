/**
 * Configuración de la activación "Claro media · DATA TECH — 15 minutos".
 *
 * Este archivo es el dueño de la relación plantilla → póster → prompt. El
 * frontend solo manda `plantilla: 1..5`, así que nunca se puede desincronizar
 * el póster que se le adjunta al modelo con el prompt que lo describe.
 *
 * Namespacing: el proyecto de Firebase (imagen-ia-845a3) hospeda varias
 * campañas a la vez, y claro-tech-summit está EN PRODUCCIÓN con participantes
 * reales. Todo lo que escribe esta activación va prefijado —colección,
 * carpetas de Storage y nombres de las funciones— para no pisarla.
 *
 * Diferencia de fondo con el Summit: allí la IA devolvía un retrato suelto al
 * que después se le componía un marco. Aquí la plantilla YA ES el póster
 * terminado (titular, badge y logos incluidos), así que lo que devuelve el
 * modelo se publica tal cual.
 */

export type DatatechPlantillaId = 1 | 2 | 3 | 4 | 5;

/** Colección de Firestore. No la comparte ninguna otra campaña. */
export const DATATECH_COLLECTION = "claro_datatech_participantes";

/** Carpetas de Storage, todas bajo el mismo prefijo. */
export const DATATECH_STORAGE = {
  originals: "claro-datatech/originales",
  generated: "claro-datatech/generadas",
  /** Plantillas que el backend publica la primera vez que se usan. */
  templates: "claro-datatech/plantillas",
} as const;

/** Los pósters son 1080×1920. */
export const DATATECH_ASPECT_RATIO = "9:16";

/**
 * Reglas de identidad, comunes a las cinco plantillas.
 *
 * Se repiten aquí en vez de importarlas de otra campaña a propósito: cada
 * activación tiene que poder ajustar su prompt sin romper una que ya está en
 * producción.
 *
 * El orden importa: la identidad va PRIMERO y con jerarquía explícita. Cuando
 * el prompt arranca por "reproduce la plantilla fielmente", el modelo trata la
 * cara del modelo profesional como parte de lo que hay que reproducir y
 * devuelve un rostro genérico y embellecido.
 */
const IDENTITY_RULES = `You are given EXACTLY TWO images, in this order:
IMAGE 1 = THE TEMPLATE. A finished campaign poster for "Claro media · DATA TECH — 15 minutos". It contains a professional model, giant 3D typography, a headline, a red "15 MINUTOS" badge and logos.
IMAGE 2 = THE VISITOR. A webcam photo of an ordinary real person at an event booth.

TASK: produce the poster of IMAGE 1 with the visitor of IMAGE 2 in place of the model.

PRIORITY ORDER — if any two instructions conflict, the lower number wins:
1. The face in the output IS the face of the person in IMAGE 2.
2. The poster of IMAGE 1 is reproduced unchanged.
3. Everything else.

=====================================================================
RULE #1 — THE FACE. THIS IS THE WHOLE POINT OF THE JOB.
=====================================================================
THE MOST COMMON FAILURE, AND THE ONE YOU MUST AVOID: the output shows a better-looking, younger, slimmer, more symmetrical version of the visitor — a face that looks like a model, an actor or an AI-generated person. If that happens the result is WORTHLESS, even if the poster around it is perfect. The visitor must look at the picture and see THEMSELVES, not a beautiful stranger who vaguely resembles them.

THE MODEL IN IMAGE 1 CONTRIBUTES ZERO TO THE FACE.
Their bone structure, nose, jaw, eyes, lips, skin, hair and proportions must not leak into the output in any amount. Do not blend the two faces. Do not average them. Do not use the model as a "reference for beauty". They are only a placeholder showing WHERE a person goes, HOW they are lit and WHAT they are wearing.

NOTHING MAY BE ADDED TO THE FACE:
- NO makeup of any kind: no foundation, powder, concealer, contour, highlighter, bronzer, blush, eyeshadow, eyeliner, mascara, false or lengthened eyelashes, lip liner, lipstick, lip gloss or tinted lips. If the visitor wears no makeup in IMAGE 2, the output has NO makeup. The models in these templates wear editorial makeup; that is THEIRS.
- NO skin retouching: no smoothing, no blurring, no soft focus, no dewy glow, no clearing of blemishes, no whitening of teeth or of the whites of the eyes.
- NO reshaping: no lifted cheekbones, no defined jaw, no narrowed nose, no larger or more open eyes, no reshaped, darkened, lengthened or filled eyebrows.
- NO added jewellery, piercings, gems or glitter beyond what the WARDROBE section of this template allows.
- NO added freckles, moles or beauty marks that are not in IMAGE 2 — and no removal of the ones that are.

THE HAIR MUST BE THE VISITOR'S — THIS IS A FREQUENT FAILURE:
Reproduce the visitor's hair exactly as photographed: same length, same cut, same parting, same direction, same volume, same frizz and loose flyaway strands, same messiness, same colour including roots and grey hairs, same hairline.
- NEVER restyle it. Do not lengthen it, do not add volume or body, do not add waves or curls, do not straighten curls, do not slick it back, do not tie it up or let it down, do not make it shinier, thicker or neater than it is.
- The models in these templates have salon hair: a sharp bob, styled waves, a groomed quiff. That is THEIRS. If the visitor has short, thin, straight, frizzy, tied-back, balding or no hair, the output has exactly that.

COPY THE VISITOR'S FACE EXACTLY, INCLUDING EVERYTHING THAT IS NOT PERFECT:
- Face shape and weight: round, full, chubby, long, square or bony stays exactly that way. NEVER slim the cheeks, NEVER sharpen or narrow the jaw, NEVER shorten the chin, NEVER reduce a double chin, NEVER change the width of the face.
- Nose: exact width, length, bridge, tip and nostrils. Wide stays wide. Hooked stays hooked.
- Eyes: exact shape, size, spacing, slant, eyelid fold, how much white shows, iris colour. Small eyes stay small. Asymmetric eyes stay asymmetric. Keep under-eye bags and dark circles.
- Eyebrows: exact thickness, shape, density and position, including sparse or very thick brows.
- Mouth and teeth: exact lip thickness and shape. Thin lips stay thin. If teeth are visible, keep the same teeth — crooked, gapped, uneven or discoloured as they are. Do not give a perfect smile.
- Skin: exact tone, never lighter. Keep acne, spots, moles, freckles, scars, birthmarks, wrinkles, expression lines, shine, pores and uneven texture. DO NOT retouch, smooth, blur, clean or airbrush the skin.
- Facial asymmetry: real faces are asymmetric. Keep every asymmetry exactly as photographed.
- Age: keep the exact apparent age. Do not rejuvenate, do not remove wrinkles, do not age.
- Facial hair: exactly as in the photo. A beard or moustache stays; if there is none, never add stubble.
- Glasses: only if the person is wearing them in IMAGE 2, with the same frame. If the template's model wears glasses and the visitor does not, the output has NO glasses.
- Build: same neck thickness and shoulder width. Do not slim the body.

HEAD POSITION AND EXPRESSION COME FROM IMAGE 2, NEVER FROM IMAGE 1:
Keep the same head angle, rotation, tilt and chin height, the same gaze direction, and the same expression. If the visitor is not smiling, the output does not smile. If the mouth is closed, it stays closed. Do not open the mouth, do not show teeth that are not visible in the photo, do not widen the eyes. Most visitors look straight at the camera and that is correct.

HOW TO THINK ABOUT THE BODY: the visitor's head, as photographed, is placed where the model's head is, at the same size and angle. The body then follows from that head — same posture and wardrobe as the model, but with the visitor's own build. If a hand gesture of the model (hand on the chin, arms crossed) no longer sits naturally under the visitor's head position, adapt the hand, never the head. Hands must look anatomically correct: five fingers, natural joints.

VERIFICATION BEFORE YOU OUTPUT — run these three checks:
1. Place the output face on top of the face in IMAGE 2. The eyes, nose, mouth and jaw outline must line up.
2. If the output face is prettier, thinner, younger, more symmetrical, better groomed or has better skin than IMAGE 2, you have failed. Redo it faithfully.
3. List everything visible on the head in your output that is NOT in IMAGE 2. That list may contain ONLY what this template's WARDROBE section allows. If it contains anything else — makeup, lashes, a different hairstyle, glasses, extra jewellery — remove it and redo.

=====================================================================
RULE #2 — THE POSTER
=====================================================================
Reproduce IMAGE 1 exactly: same composition, same crop, same camera distance, same scale and position of the subject in the frame, same colour palette, same studio lighting, same depth of field.

ALL TEXT MUST BE REPRODUCED CHARACTER FOR CHARACTER, with the same typeface, weight, colour, size and position. Spanish accents and the ñ matter. Never re-letter, translate, re-spell, move, resize or re-colour any text. Specifically:
- The red "15 MINUTOS" badge in the TOP-LEFT corner, with "15" large and "MINUTOS" small underneath.
- The giant 3D word behind the subject.
- The headline in the lower-left, with its red underline.
- The "Claro media" logo (Claro in red with its accent mark, media in white) and the outlined "DATA TECH" badge, both in the lower-right.
Never add other logos, captions, borders, frames, watermarks or signatures.

Exactly ONE person in the output. If IMAGE 2 contains several people, use only the one who is largest and closest to the centre, and ignore the rest.`;

const OUTPUT_RULES = `OUTPUT: the complete poster, vertical 9:16, same resolution, sharpness and print quality as IMAGE 1. The ONLY difference between IMAGE 1 and the output is WHO the person is — and that person must be unmistakably, unflatteringly, recognisably the visitor from IMAGE 2.`;

/** Lo que cambia de una plantilla a otra: el vestuario según el género. */
const wardrobe = (
  modelo: "hombre" | "mujer",
  prenda: string,
  equivalente: string,
  accesorios: string,
) => `WARDROBE — read the visitor's gender from IMAGE 2 first. The model in IMAGE 1 is a ${modelo === "mujer" ? "WOMAN" : "MAN"}:
• IF THE VISITOR MATCHES THE MODEL'S GENDER: keep ${prenda} exactly as in IMAGE 1${accesorios ? `, including ${accesorios}` : ""}.
• IF THE VISITOR IS OF THE OTHER GENDER: keep the same colour, fabric and formality, but ${equivalente}. Never put a visibly male visitor in a feminine garment or vice versa, and never add earrings, makeup or jewellery to a man.
• IF THE GENDER IS AMBIGUOUS: a neutral, well-cut version of the same outfit, no earrings, no makeup, no jewellery.
The garment must fit the visitor's actual build: do not slim the body to fit the model's clothes.`;

export interface DatatechPlantilla {
  id: DatatechPlantillaId;
  /** Palabra 3D del póster; es como se identifica internamente. */
  palabra: string;
  /** Titular, tal como va impreso. Se muestra también en el kiosco. */
  titular: string;
  /**
   * Archivo dentro de backend/functions/assets/datatech/. El backend lo publica
   * en Storage la primera vez que se usa, así que no hay que subir nada a mano.
   */
  templateFile: string;
  prompt: string;
}

export const DATATECH_PLANTILLAS: Record<DatatechPlantillaId, DatatechPlantilla> = {
  1: {
    id: 1,
    palabra: "DATA",
    titular: "Decido con data relevante",
    templateFile: "plantilla-1.jpg",
    prompt: `${IDENTITY_RULES}

=====================================================================
THIS TEMPLATE — "DATA"
=====================================================================
IMAGE 1 shows a WOMAN seated on a white cube, her chin resting on her hand, against giant WHITE three-dimensional letters reading "DATA" on a smooth grey studio backdrop that graduates from light on the left to dark on the right. Soft, even studio lighting.
- Reproduce the white 3D "DATA" lettering exactly: same extrusion, same depth, same shadows, same position behind the subject.
- The headline in the lower left reads "Decido con" / "data" / "relevante", with the word "data" in red and the rest in black, over the lighter part of the backdrop, underlined in red.
- Keep the grey gradient backdrop and the white cube seating exactly as they are.

${wardrobe(
  "mujer",
  "the bright orange long blazer over a cream silk blouse and cream trousers",
  "dress him in a bright orange blazer of the same shade over a cream shirt and cream trousers, cut for a man, with no necklace",
  "the fine gold necklace",
)}

${OUTPUT_RULES}`,
  },
  2: {
    id: 2,
    palabra: "CONECTO",
    titular: "Conecto alcance con intención",
    templateFile: "plantilla-2.jpg",
    prompt: `${IDENTITY_RULES}

=====================================================================
THIS TEMPLATE — "CONECTO"
=====================================================================
IMAGE 1 shows a MAN leaning back against giant WHITE three-dimensional letters reading "CONECTO", arms crossed, on a dark charcoal studio backdrop. Crisp, contrasty studio lighting.
- Reproduce the white 3D "CONECTO" lettering exactly: same extrusion, same depth, same shadows, same position behind the subject.
- The headline in the lower left reads "Conecto" / "alcance" / "con intención", with "alcance" in red and the rest in white, underlined in red.
- Keep the dark charcoal backdrop and the white blocks exactly as they are.
- IMPORTANT: the model wears black-framed glasses and has a trimmed beard. Both are HIS. The visitor only wears glasses if they wear them in IMAGE 2, and only has a beard if they have one in IMAGE 2.

${wardrobe(
  "hombre",
  "the dark navy single-breasted suit over an open-collar white shirt, and the black-strapped wristwatch",
  "dress her in a dark navy trouser suit of the same fabric over an open-collar white shirt, cut for a woman, keeping the wristwatch and adding no other jewellery",
  "the wristwatch",
)}

${OUTPUT_RULES}`,
  },
  3: {
    id: 3,
    palabra: "INSIGHTS",
    titular: "Transformo insights en oportunidades",
    templateFile: "plantilla-3.jpg",
    prompt: `${IDENTITY_RULES}

=====================================================================
THIS TEMPLATE — "INSIGHTS"
=====================================================================
IMAGE 1 shows a WOMAN seated, chin resting on her hand, against giant DARK GREY three-dimensional letters reading "INSIGHTS" on a pale grey studio backdrop with white cubes. Soft, bright, editorial lighting.
- Reproduce the dark grey 3D "INSIGHTS" lettering exactly: same extrusion, same depth, same shadows, same position behind the subject.
- The headline in the lower left reads "Transformo" / "insights" / "en oportunidades", with "insights" in red and the rest in white, underlined in red.
- Keep the pale grey backdrop and the white cubes exactly as they are.
- IMPORTANT: the model has long styled auburn waves falling over one eye. That hair is HERS. The visitor keeps their own hair exactly as photographed, and it does not fall over the face unless it does so in IMAGE 2.

${wardrobe(
  "mujer",
  "the terracotta trouser suit worn over a bare neckline",
  "dress him in a terracotta suit of the same shade over a plain shirt of the same tone, fully covering the chest, with no earrings and no bracelet",
  "the long crystal drop earrings and the wide metal cuff bracelet",
)}
If the visitor is a woman, raise the blazer's neckline enough to be appropriate for a corporate event: no visible cleavage.

${OUTPUT_RULES}`,
  },
  4: {
    id: 4,
    palabra: "AUDIENCIAS",
    titular: "Activo audiencias con precisión",
    templateFile: "plantilla-4.jpg",
    prompt: `${IDENTITY_RULES}

=====================================================================
THIS TEMPLATE — "AUDIENCIAS"
=====================================================================
IMAGE 1 shows a MAN seated on white steps, chin resting on his hand, against giant WHITE three-dimensional letters reading "AUDIENCIAS" on a deep RED backdrop. Dramatic, saturated studio lighting.
- Reproduce the white 3D "AUDIENCIAS" lettering exactly: same extrusion, same depth, same shadows, same position behind the subject.
- The headline in the lower left reads "Activo" / "audiencias" / "con precisión", with "audiencias" in red and the rest in white, underlined in red.
- Keep the deep red backdrop and the white stepped blocks exactly as they are. The red must stay the same saturated Claro red, not pink and not orange.

${wardrobe(
  "hombre",
  "the bright red suit over a black shirt",
  "dress her in a bright red trouser suit of the same shade over a black shirt, cut for a woman, with no earrings and no necklace",
  "",
)}

${OUTPUT_RULES}`,
  },
  5: {
    id: 5,
    palabra: "SEÑALES",
    titular: "Convierto señales en decisiones",
    templateFile: "plantilla-5.jpg",
    prompt: `${IDENTITY_RULES}

=====================================================================
THIS TEMPLATE — "SEÑALES"
=====================================================================
IMAGE 1 shows a MAN standing, leaning against giant RED three-dimensional letters reading "SEÑALES" on a pale grey studio backdrop. Bright, clean studio lighting.
- Reproduce the red 3D "SEÑALES" lettering exactly: same extrusion, same depth, same shadows, same position behind the subject. The Ñ KEEPS ITS TILDE — this is the most frequent text error on this template.
- The headline in the lower left reads "Convierto" / "señales" / "en decisiones", with "señales" in red and the rest in white, underlined in red.
- Keep the pale grey backdrop exactly as it is.

${wardrobe(
  "hombre",
  "the black formal suit with a black tie over a white shirt, the white pocket square and the leather-strapped wristwatch",
  "dress her in a black formal trouser suit over a white shirt, cut for a woman, keeping the pocket square and the wristwatch, with no tie, no earrings and no necklace",
  "the pocket square and the wristwatch",
)}

${OUTPUT_RULES}`,
  },
};

export const isDatatechPlantillaId = (v: unknown): v is DatatechPlantillaId =>
  v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
