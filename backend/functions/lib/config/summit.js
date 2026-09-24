"use strict";
/**
 * Configuración de la activación "Claro Tech Summit 2026 · Soluciones Digitales".
 *
 * Este archivo es el dueño de la relación filtro → referencia de estilo → prompt.
 * El frontend solo manda `filtro: 1 | 2 | 3 | 4`, así que nunca se puede
 * desincronizar la imagen de referencia que se le adjunta al modelo con el
 * prompt que la describe.
 *
 * Namespacing: este proyecto de Firebase (imagen-ia-845a3) hospeda varias
 * campañas a la vez. Todo lo que escribe esta activación va prefijado —
 * colección, carpetas de Storage y nombres de las funciones— para no pisar a
 * feria-colombia, circus ni a las funciones genéricas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSummitFilterId = exports.SUMMIT_FILTERS = exports.SUMMIT_FRAME = exports.SUMMIT_ASPECT_RATIO = exports.SUMMIT_MODELS = exports.SUMMIT_STORAGE = exports.SUMMIT_COLLECTION = void 0;
/** Colección de Firestore. No la comparte ninguna otra campaña. */
exports.SUMMIT_COLLECTION = "claro_tech_summit_participantes";
/** Carpetas de Storage, todas bajo el mismo prefijo. */
exports.SUMMIT_STORAGE = {
    originals: "claro-tech-summit/originales",
    generated: "claro-tech-summit/generadas",
    /** Referencias de estilo que el backend publica la primera vez que se usan. */
    references: "claro-tech-summit/referencias",
};
exports.SUMMIT_MODELS = {
    replicate: "google/nano-banana-2",
    fal: "fal-ai/nano-banana-2/edit",
};
/**
 * El lienzo final es 1123×1401 (≈0.80) y el retrato entra con `contain`, así
 * que 3:4 (0.75) es la relación soportada que menos aire deja a los lados.
 */
exports.SUMMIT_ASPECT_RATIO = "3:4";
/**
 * Geometría del arte del resultado (paso_4.png), en píxeles del lienzo
 * original. La genera scripts/prepare-summit-assets.py; si diseño entrega un
 * marco nuevo hay que volver a correrlo y actualizar estos números.
 */
exports.SUMMIT_FRAME = {
    canvas: { width: 1123, height: 1401 },
    /**
     * Extensión de la silueta dentro del lienzo, con su degradado incluido.
     * Solo documental: la máscara es del tamaño del lienzo y se aplica entera.
     * La calcula prepare-summit-assets.py.
     */
    silhouette: { left: 40, top: 15, width: 1042, height: 1318 },
    /**
     * Logos de las esquinas superiores. Van encima de todo —retrato y marco—
     * porque el cliente los quiere siempre visibles.
     *
     * `width` es el ancho final en píxeles del lienzo; el alto sale solo de la
     * proporción del archivo. Los márgenes se miden desde el borde del lienzo.
     */
    logos: {
        left: { file: "logo-izquierda.png", width: 340, margin: { x: 34, y: 30 } },
        right: { file: "logo-derecha.png", width: 250, margin: { x: 34, y: 26 } },
    },
};
/**
 * Reglas de identidad, comunes a los cuatro estilos.
 *
 * Se repiten aquí en vez de importarlas de otra campaña a propósito: cada
 * activación tiene que poder ajustar su prompt sin romper una que ya está en
 * producción.
 *
 * El orden importa: la identidad va PRIMERO y con jerarquía explícita. Cuando
 * el prompt arranca describiendo el estilo, el modelo trata la cara de la
 * modelo de referencia como parte del estilo y devuelve un rostro genérico.
 */
const IDENTITY_RULES = `You are given EXACTLY TWO images, in this order:
IMAGE 1 = THE STYLE REFERENCE. An example artwork showing the artistic treatment to apply. It happens to contain a professional model. She is NOT the subject — she is only a sample of the technique.
IMAGE 2 = THE VISITOR. A webcam photo of an ordinary real person at an event booth.

TASK: render the person of IMAGE 2 as a portrait in the artistic style of IMAGE 1.

PRIORITY ORDER — if any two instructions conflict, the lower number wins:
1. The face in the output IS the face of the person in IMAGE 2.
2. The artistic technique, palette and background of IMAGE 1 are reproduced.
3. Everything else.

=====================================================================
RULE #1 — THE FACE. THIS IS THE WHOLE POINT OF THE JOB.
=====================================================================
THE MOST COMMON FAILURE, AND THE ONE YOU MUST AVOID: the output shows a better-looking, younger, slimmer, more symmetrical version of the visitor — or worse, the model from IMAGE 1 wearing the visitor's vague likeness. If that happens the result is WORTHLESS, even if the artwork around it is perfect. The visitor must look at the screen and see THEMSELVES, not a beautiful stranger.

THE MODEL IN IMAGE 1 CONTRIBUTES ZERO TO THE FACE.
Her bone structure, nose, jaw, eyes, lips, skin, hair, age, build and proportions must not leak into the output in any amount. Do not blend the two faces. Do not average them. Do not use her as a "reference for beauty". IMAGE 1 is a swatch of technique, nothing more. Her pose, her gesture, her smile, her hairstyle and her wardrobe are HERS and are not instructions.

NOTHING MAY BE ADDED TO THE FACE beyond what the STYLE section of this specific filter allows:
- NO makeup of any kind: no foundation, powder, concealer, contour, highlighter, bronzer, blush, eyeshadow, eyeliner, mascara, false or lengthened eyelashes, lip liner, lipstick, lip gloss or tinted lips. If the visitor wears no makeup in IMAGE 2, the output has NO makeup.
- NO skin retouching: no smoothing, no blurring, no soft focus, no dewy glow, no clearing of blemishes, no whitening of teeth or of the whites of the eyes.
- NO reshaping: no lifted cheekbones, no defined jaw, no narrowed nose, no larger or more open eyes, no reshaped, darkened, lengthened or filled eyebrows.
- NO added jewellery, piercings, gems, glitter or shimmer that the visitor is not already wearing in IMAGE 2.
- NO added freckles, moles or beauty marks that are not in IMAGE 2 — and no removal of the ones that are.

THE HAIR MUST BE THE VISITOR'S — THIS IS A FREQUENT FAILURE:
Reproduce the visitor's hair as photographed: same length, same cut, same parting, same direction, same volume, same frizz and loose strands, same messiness, same colour including roots and grey hairs, same hairline.
- NEVER restyle it. Do not lengthen it, do not add volume or body, do not add waves or curls, do not straighten curls, do not tie it up or let it down, do not make it shinier or thicker than it is.
- The long wavy hair of the model in IMAGE 1 is HERS. If the visitor has short, thin, straight, tied-back or no hair, the output has short, thin, straight, tied-back or no hair.

COPY THE VISITOR'S FACE EXACTLY, INCLUDING EVERYTHING THAT IS NOT PERFECT:
- Face shape and weight: round, full, chubby, long, square or bony stays exactly that way. NEVER slim the cheeks, NEVER sharpen or narrow the jaw, NEVER reduce a double chin, NEVER change the width of the face.
- Nose: exact width, length, bridge, tip and nostrils. Wide stays wide. Hooked stays hooked.
- Eyes: exact shape, size, spacing, slant, eyelid fold, iris colour. Small eyes stay small. Asymmetric eyes stay asymmetric. Keep under-eye bags and dark circles.
- Eyebrows: exact thickness, shape, density and position, including sparse or very thick brows.
- Mouth and teeth: exact lip thickness and shape. Thin lips stay thin. If teeth are visible, keep the same teeth — crooked, gapped or uneven as they are. Do not give a perfect smile.
- Skin: exact tone, never lighter. Keep acne, spots, moles, freckles, scars, birthmarks, wrinkles, expression lines and uneven texture.
- Facial asymmetry: real faces are asymmetric. Keep every asymmetry exactly as photographed.
- Age: keep the exact apparent age. Do not rejuvenate, do not age.
- Facial hair: exactly as in the photo. A beard or moustache stays; if there is none, never add stubble.
- Glasses: only if the person is wearing them, with the same frame.
- Gender presentation: read it from IMAGE 2 alone. The model in IMAGE 1 is a woman; if the visitor is a man, the output is unmistakably a man — no earrings, no makeup, no feminine wardrobe.
- Build: same neck thickness and shoulder width. Do not slim the body.

TECHNIQUE VS. IDENTITY: the filter's technique changes the SURFACE of the face — how it is lit, textured, coloured or rendered — but it NEVER changes its geometry, its proportions or its imperfections. If the style is a watercolour, the visitor's wrinkles, moles and asymmetries are still there, translated into watercolour; the style is not an excuse to render a smooth generic face.

HEAD POSITION AND EXPRESSION COME FROM IMAGE 2, NEVER FROM IMAGE 1:
Keep the same head angle, rotation, tilt and chin height, the same gaze direction, and the same expression. If the visitor is not smiling, the output does not smile. If the mouth is closed, it stays closed. Do not open the mouth, do not show teeth that are not visible in the photo, do not widen the eyes. Most visitors look straight at the camera and that is correct. DO NOT copy the model's peace-sign gesture or her raised hand: the visitor's hands only appear if they are in IMAGE 2, doing what they do there.

VERIFICATION BEFORE YOU OUTPUT — run these three checks:
1. Place the output face on top of the face in IMAGE 2. The eyes, nose, mouth and jaw outline must line up.
2. If the output face is prettier, thinner, younger, more symmetrical, better groomed or has better skin than IMAGE 2, you have failed. Redo it faithfully.
3. List everything visible on the head in your output that is NOT in IMAGE 2. That list may contain ONLY what this filter's STYLE section allows. If it contains anything else — makeup, lashes, glow, a different hairstyle, extra jewellery — remove it and redo.

=====================================================================
RULE #2 — THE FRAMING
=====================================================================
Vertical portrait, head and shoulders to mid-chest, centred, with clear headroom above the hair. LEAVE MARGIN: the subject —including all of the hair— must sit well inside the frame and must NOT touch or run off any edge. Frame a little wider than IMAGE 1 does: there must be visible background between the hair and both side edges. The artwork is later cropped into a rounded shape, so anything touching an edge gets cut off. Exactly ONE person in the output: if IMAGE 2 contains several people, use only the one who is largest and closest to the centre and ignore the rest.
Do NOT draw any frame, border, card, label, caption, logo, watermark or text. The output is only the portrait and its background — the event's frame is added afterwards by the application.`;
const OUTPUT_RULES = `OUTPUT: a single vertical portrait, 3:4, sharp and high quality, filling the whole canvas edge to edge. The person in it must be unmistakably, unflatteringly, recognisably the visitor from IMAGE 2.`;
exports.SUMMIT_FILTERS = {
    1: {
        id: 1,
        label: "Acuarela",
        referenceFile: "referencia-1.jpg",
        prompt: `${IDENTITY_RULES}

=====================================================================
THIS FILTER — WATERCOLOUR PORTRAIT
=====================================================================
STYLE: a hand-painted watercolour illustration on textured cream paper. Loose, translucent washes with visible pigment blooms, soft bleeding edges and a few deliberate drips and splatters. The background is an explosion of coral, red and warm ochre washes radiating outwards from the head, fading to bare paper at the corners. Brushwork stays visible — this must read as paint on paper, never as a photo with a filter.
- The face is painted with control: enough detail that every feature of IMAGE 2 is legible, with soft graded washes for the skin and darker pigment in the shadows. The loose, splashy handling belongs to the background and the outer edges of the hair and clothing, not to the face.
- Palette: warm reds, corals, terracotta and soft ochres against cream paper. Keep it warm — no blues or greens beyond a faint grey in the deepest shadows.
- The visitor's clothing is painted in the same loose watercolour language, in light neutral tones.
- Texture of the paper shows through everywhere, including the skin.

${OUTPUT_RULES}`,
    },
    2: {
        id: 2,
        label: "Ilustración",
        referenceFile: "referencia-2.jpg",
        prompt: `${IDENTITY_RULES}

=====================================================================
THIS FILTER — BOLD DIGITAL ILLUSTRATION
=====================================================================
STYLE: a stylised digital illustration — clean confident linework, smooth cel-like shading with crisp shadow shapes, saturated colour and high contrast. Modern editorial / comic-cover treatment, rendered, not flat.
- Background: near-black with dynamic diagonal brush strokes and slashes of vivid Claro red (#E30613) sweeping behind the head. Graphic and energetic, clearly painted strokes rather than a photographic backdrop.
- Rim light: a strong red-to-warm edge light along one side of the face, the jaw and the hair, separating the subject from the dark background. The key light on the face stays neutral so the skin keeps the visitor's real tone.
- The hair is illustrated with bold flowing strands and red light catching the edges — but it is the VISITOR'S hair: same length, same cut, same volume. Do not lengthen or add waves.
- Clothing is illustrated in dark tones with red accents.
- Skin is rendered in smooth cel shading, but every mole, line and asymmetry from IMAGE 2 survives as part of the drawing.

${OUTPUT_RULES}`,
    },
    3: {
        id: 3,
        label: "Universo Fantástico",
        referenceFile: "referencia-3.jpg",
        prompt: `${IDENTITY_RULES}

=====================================================================
THIS FILTER — FANTASTIC UNIVERSE
=====================================================================
STYLE: a cinematic, hyper-detailed fantasy portrait. The subject stands in deep space: a black field full of drifting red embers, sparks and bokeh particles, with a large glowing red neon ring arcing behind the head like a halo or portal.
- Lighting: dramatic and directional. Intense red rim light wraps the hair, the shoulders and one side of the face; the front of the face keeps a neutral fill so the visitor's real skin tone and features stay readable. Deep blacks, glowing reds, no washed-out midtones.
- Fine sparks and glowing particles float in front of and behind the subject, catching on the hair. They never cover the face.
- Wardrobe: the visitor's own clothing, reinterpreted with a subtle metallic, iridescent sheen catching the red light. Do NOT invent an armour, a costume, a plunging neckline or any garment that changes how much of the body is covered — keep the coverage and the neckline of IMAGE 2.
- Photorealistic rendering with a fantasy grade: the skin keeps real pores, texture and every imperfection from IMAGE 2, lit by red light.

${OUTPUT_RULES}`,
    },
    4: {
        id: 4,
        label: "Cyberpunk",
        referenceFile: "referencia-4.jpg",
        prompt: `${IDENTITY_RULES}

=====================================================================
THIS FILTER — CYBERPUNK
=====================================================================
STYLE: a neon-drenched cyberpunk night portrait. The subject stands in a futuristic city street at night; behind them, out-of-focus neon signage, holographic panels and skyscraper lights in magenta, electric blue, cyan and violet, heavily bokeh'd so the face stays the sharpest thing in the frame.
- Lighting: classic neon two-tone. Hot magenta/pink rim light down one side of the face and hair, cool blue/cyan fill on the other, with the front of the face keeping enough neutral light that the visitor's real features and skin tone stay recognisable. Strong contrast, glowing highlights, deep shadows.
- The hair catches magenta and violet light along its edges — but the CUT, LENGTH and VOLUME are the visitor's from IMAGE 2. Never lengthen it or add waves.
- Wardrobe: the visitor's own clothing restyled as dark techwear — a black jacket with thin glowing neon piping and small light accents. Keep the same coverage and neckline as IMAGE 2. No exposed chest, no costume, no cleavage that is not in IMAGE 2.
- Rendered as a polished digital illustration: crisp, saturated, cinematic — but the face geometry and every imperfection come from IMAGE 2.

${OUTPUT_RULES}`,
    },
};
const isSummitFilterId = (value) => value === 1 || value === 2 || value === 3 || value === 4;
exports.isSummitFilterId = isSummitFilterId;
//# sourceMappingURL=summit.js.map