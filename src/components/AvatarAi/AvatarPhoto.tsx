import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logo_final.png";
import WebcamScene from "../WebcamScene";
import aiImageService from "../../services/aiImageService";
import Swal from "sweetalert2";

interface AvatarPhotoProps {
  onProcess: (email: string) => void;
  onAiImageReady: (imageUrl: string, originalImageDataUrl: string) => void;
}
interface WebcamRef {
  captureImage: () => Promise<Blob>;
}

const AvatarPhoto: React.FC<AvatarPhotoProps> = ({ onProcess, onAiImageReady }) => {
  const [email] = useState("");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<string>(""); // "terror" o "clasico"
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Estilo específico del modo
  
  const webcamRef = useRef<WebcamRef | null>(null);

  // URL del logo del circo que se agregará a todas las imágenes
  const CIRCUS_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/Circo%2Flogo.jpg?alt=media&token=38c82c33-7ffb-4296-b3e8-a202064110a2";

  // Función para generar el prompt basado en el modo y estilo seleccionado
  const getPromptByStyle = (mode: string, style: string): string => {
    // MODO ESPECIAL: FONDO TERRORÍFICO - Solo cambiar fondo, mantener TODO lo demás
    if (mode === "fondo-terrorifico") {
      return `PHOTOREALISTIC BACKGROUND REPLACEMENT - ABSOLUTE SUBJECT PRESERVATION:

CRITICAL RULES - ZERO MODIFICATIONS TO PEOPLE (HIGHEST PRIORITY):
- Keep 100% EXACT EVERYTHING about the person(s): their EXACT clothing/outfit they're wearing, their EXACT face, their EXACT hair (color, style, length), their EXACT pose and position
- DO NOT change their clothes - they stay in the SAME outfit they're wearing in the input photo
- DO NOT change hairstyles or hair color - keep their EXACT hair as shown
- DO NOT alter faces, facial features, skin tone, or expressions
- DO NOT modify their poses, positions, or body language
- DO NOT add props or accessories they don't have
- If multiple people: keep ALL people exactly as shown, same relative positions, same everything

SINGLE OR MULTIPLE PEOPLE:
- This photo may contain ONE person OR MULTIPLE people
- Output must show the EXACT SAME NUMBER of people in EXACT SAME positions
- ALL people maintain their EXACT appearance, clothing, poses, and spatial relationships
- NO merging, NO swapping, NO adding/removing people

YOUR ONLY TASK: CREATE A DARK CIRCUS-THEMED BACKGROUND
Replace the background with a terrifying circus atmosphere while keeping the subject(s) completely unchanged:

BACKGROUND CONCEPT - CREATIVE FREEDOM:
- Dark, ominous circus environment with horror aesthetic
- Include sinister circus elements: skulls, skeletons, creepy circus decorations
- Atmospheric and mysterious - fog, shadows, dramatic lighting
- Color palette: dark tones, deep purples, blood reds, midnight blues, eerie greens
- Circus theme evident but with dark/macabre twist
- Create unique variations - be creative with the specific elements and composition

MOOD & LIGHTING:
- Dark, moody, atmospheric horror ambiance
- Subject(s) remain well-lit to preserve their exact appearance
- Background has eerie, dramatic lighting creating mystery
- Volumetric fog and atmospheric effects adding depth
- Horror cinema aesthetic - Tim Burton meets dark carnival

COMPOSITION:
- Subject(s) stay in same position as input photo - DO NOT move or repose them
- Terrifying circus background surrounds them creating dramatic contrast
- 4:5 vertical format optimized for mobile
- Background enhances drama without overpowering subjects

CIRCUS LOGO INTEGRATION:
A second reference image contains the circus logo. Incorporate it into the scene:
- Position elegantly in corner or integrated into background
- Add visual enhancements: glowing edges, ethereal light, sparkle
- Logo fits the horror aesthetic with aged or glowing appearance
- Keep clear and readable, roughly 15-20% of image size

QUALITY:
- Photorealistic horror cinema quality
- Sharp focus on subject(s), atmospheric depth in background
- Professional color grading with horror tones
- Natural film grain adding authenticity

STRICTLY PRESERVE:
✅ Subject's EXACT clothing/outfit (DO NOT change to costume)
✅ Subject's EXACT face, features, skin tone
✅ Subject's EXACT hair color, style, length
✅ Subject's EXACT pose and body position
✅ ALL people in photo (count and positions)

ONLY CHANGE:
❌ Background environment → Create terrifying circus setting with skulls and dark elements
❌ Lighting atmosphere → Add horror mood lighting
❌ Background composition → Be creative with circus horror details

Think: Green screen photography - subject(s) perfectly preserved, background completely replaced with creative dark circus horror environment featuring skulls and sinister elements. NO costume change, NO styling change, ONLY background replacement.`;
    }

    const baseInstructions = `PHOTOREALISTIC PORTRAIT SESSION - ABSOLUTE FACE PRESERVATION CRITICAL: This is a professional photo shoot of the EXACT person(s) from the input image wearing circus-themed costumes. You are ONLY changing their outfit and background - NOTHING ELSE.

IMPORTANT - SINGLE OR MULTIPLE PEOPLE:
- This photo may contain ONE person OR MULTIPLE people (2, 3, 4+ people)
- Count how many people are in the input photo
- Create the EXACT SAME NUMBER of people in the output - no more, no less
- EACH person must maintain their EXACT position relative to others
- If there are 3 people, output must show those SAME 3 people in circus costumes
- Apply the circus theme to ALL people in the photo equally
- Keep their relative positions, heights, and spatial relationships EXACTLY as shown

CRITICAL IDENTITY PRESERVATION RULES (HIGHEST PRIORITY - NON-NEGOTIABLE):
FOR EACH AND EVERY PERSON IN THE PHOTO:
- Keep 100% EXACT facial structure: their specific jawline, their specific cheekbones, their specific chin shape, their specific forehead
- Keep 100% EXACT eye shape, their EXACT eye color, their EXACT eye spacing, their EXACT eyebrow shape and natural position
- Keep 100% EXACT nose - their specific nose shape, bridge, nostrils, size - DO NOT modify
- Keep 100% EXACT lips - their specific lip shape, fullness, mouth width - DO NOT modify
- Keep 100% EXACT skin tone and skin texture - their specific complexion, pores, texture
- Keep 100% EXACT any facial marks: freckles, moles, beauty marks, scars, birthmarks in exact positions
- Keep 100% EXACT age appearance - wrinkles, laugh lines, skin maturity exactly as shown
- Keep 100% EXACT hair: their EXACT natural hair color, their EXACT hair texture (straight/wavy/curly), their EXACT hair thickness and length - DO NOT change color or texture, ONLY gently style what's already there
- Keep 100% EXACT gender expression and body proportions
- Keep 100% EXACT facial proportions and symmetry
- EACH person MUST be IMMEDIATELY and OBVIOUSLY recognizable as themselves - family and friends should recognize them instantly

MAKEUP & STYLING RULES - ZERO FACE MODIFICATIONS:
- NO makeup of any kind - keep faces 100% bare and natural
- NO face paint, NO theatrical makeup, NO cosmetic additions
- NO dots, NO symbols, NO decorative marks on face
- NO color on lips beyond their natural lip color
- NO powder, NO shimmer, NO anything applied to face
- Keep their skin exactly as it appears naturally
- Hair styling: ONLY gentle combing/brushing - NEVER change color, never change texture

CIRCUS TRANSFORMATION APPROACH:
You are creating a professional portrait photo where THESE SPECIFIC PEOPLE are wearing circus costumes for a themed photoshoot. Think: Actor headshot(s) in costume, NOT character replacement. The costume, props, lighting, and background create the circus theme - each person's face remains untouched and natural.`;
    
    const commonEnding = `\n\nFINAL CRITICAL REMINDER - ABSOLUTE FACE PRESERVATION:
This is portrait photography of the EXACT REAL PERSON(S) in circus costume(s). Their ENTIRE FACE(S) must remain 100% IDENTICAL to the input photo:
- Their EXACT face shape, bone structure, proportions
- Their EXACT eyes (color, shape, spacing), nose (exact shape), mouth (exact shape)  
- Their EXACT skin tone and texture
- Their EXACT natural hair (color, texture, length) - only gently styled, NEVER changed
- NO face morphing, NO feature alterations, NO cosmetic changes
- They must look EXACTLY like themselves - instantly recognizable to anyone who knows them

Only change: Costume worn, background/environment, and professional photographic lighting. Think: Professional costume photoshoot, NOT face transformation.

CIRCUS LOGO INTEGRATION - CRITICAL:
A second reference image contains the circus logo. You MUST incorporate this logo into the final composition in an ELEGANT and VISUALLY STRIKING way:

LOGO PLACEMENT & STYLE:
- Position the logo strategically in the composition - options: corner (top-left, top-right, bottom-left, or bottom-right), or elegantly integrated into the background/environment
- The logo should be CLEARLY VISIBLE and PROMINENT but artistically integrated, not just pasted on
- Transform the logo to match the circus aesthetic: add ENHANCED VISUAL EFFECTS making it spectacular:
  * Glowing edges with golden or colored light emanating from the logo
  * Subtle sparkle/shimmer effects around the logo borders
  * Light reflections and lens flare effects making it catch the eye
  * Enhance any metallic or gold elements in the logo with realistic shine
  * Add depth with subtle shadow or 3D effect
  * Optional: Floating magical particles or light wisps near the logo
  * Make it look like premium branding - polished, professional, eye-catching

LOGO ENHANCEMENTS:
- If the logo has gold/metallic elements: make them gleam and reflect light beautifully
- Add subtle glow/halo effect around logo perimeter (matching scene lighting - gold, red, or scene colors)
- Ensure logo has crisp sharp edges while maintaining artistic integration
- The logo should feel like part of the theatrical circus environment, not a sticker
- Lighting on logo should match the scene's dramatic lighting (if scene has warm light, logo glows warm; if cool, logo has cool accents)
- Optional decorative frame around logo using circus motifs (ornate borders, flourishes, ribbons)

LOGO QUALITY:
- Keep logo crystal clear and readable - NO blur, NO distortion on the logo itself
- Enhance logo colors to be rich and vibrant
- Logo should have premium quality appearance - like watermark in high-end magazine
- PNG transparency handling: blend logo edges smoothly into scene
- Size: prominent enough to be noticed but not overpowering the subject (roughly 15-20% of image dimension)

The logo should feel like an elegant premium brand element that ENHANCES the overall composition's theatrical circus grandeur.

IF MULTIPLE PEOPLE IN PHOTO:
- Output the SAME NUMBER of people as in input (if 2 people in input → 2 people in output, if 3 → 3, etc.)
- EACH person gets their own circus costume matching the selected theme/style
- PRESERVE each person's unique identity 100% - Person A stays Person A, Person B stays Person B
- Keep their EXACT relative positions (left/right, front/back, standing/sitting)
- Keep their EXACT height relationships and spatial arrangement
- ALL people should be in matching/complementary circus theme costumes
- NO merging faces, NO swapping positions, NO adding/removing people
- Each person must be individually recognizable as their original self

LIGHTING: Three-point lighting setup with dramatic key light, soft fill, vibrant rim light. Volumetric fog/haze catching light rays. Cinematic color grading with rich saturated colors, deep blacks, glowing highlights.

COMPOSITION: Vertical 4:5 mobile format. Rule of thirds positioning, dynamic pose, eye contact with camera. Immersive themed background with atmospheric depth, practical lights, environmental details. Logo integrated elegantly into composition.

QUALITY: Magazine cover quality, Vogue/Vanity Fair editorial standard. Professional retouching maintaining natural skin texture, enhanced eye catchlights, subtle lens flare, film grain. Logo appearing as premium branding element.

STRICTLY AVOID: Changing ANY facial features, face shape, eye color/shape, nose shape, lip shape, skin tone, hair color/texture. Adding or removing people. Merging people together. Duplicating a person. Swapping positions. Blurry or distorted logo. Logo covering faces. No cartoon/anime style, no distorted anatomy, no extra limbs, no text/watermarks beyond the integrated logo, no plastic/overly smooth skin. Keep it 100% photorealistic with their REAL unchanged face(s) and a beautifully enhanced elegant logo.`;
    
    // MODO TERROR
    if (mode === "terror") {
      switch (style) {
        case "payaso-maldito":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: CURSED NIGHTMARE CLOWN - Demonic carnival entity from haunted circus risen from darkness.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Torn aged vintage clown costume weathered and decayed - ripped dirt-covered fabrics, tattered demonic theatrical wear, distressed Gothic elements. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO face paint, NO additions whatsoever. Style hair naturally disheveled using THEIR EXACT natural color/texture. The TERRIFYING COSTUME creates pure horror, NOT the face.\n\nINTENSE ATMOSPHERIC HORROR ELEMENTS (AI creative freedom - MAKE IT TERRIFYING): Nightmarish abandoned apocalyptic circus in darkness. Include EXTREME atmospheric horror: hundreds of human skulls and complete skeletons scattered throughout environment creating bone garden, skeletal remains forming archways, possessed demonic dolls with glowing supernatural red eyes floating, decomposing decayed circus props covered in rust, heavy chains and iron restraints, satanic occult symbols carved everywhere, ghostly transparent apparitions of dead performers floating through fog, hellfire flames consuming circus tent creating inferno glow, massive thunder and violent lightning strikes illuminating nightmare, swarms of vampire bats with glowing eyes, murders of ravens with supernatural presence, thick spiderwebs covering everything creating haunted aesthetic, rats with glowing red eyes. Cemetery circus with ancient tombstones and open graves revealing darkness. Apocalyptic horror atmosphere with extreme fog - visceral terror aesthetic. Horror movie quality nightmare.\n\nMOOD & AESTHETIC: PURE NIGHTMARE FUEL - visceral atmospheric horror. The Exorcist meets IT meets American Horror Story Freak Show. Genuinely disturbing and horrifying environmental terror. Color palette: Deep crimson reds, death blacks, corpse pale grays, toxic supernatural greens, disease purples, decay browns. EXTREME dramatic horror lighting - harsh shadows concealing demonic entities, massive lightning flashes revealing skeletal horror, blood-red moon glow, hellfire orange illumination from inferno, volumetric thick supernatural fog obscuring nightmares everywhere. Heavy rain pouring, thunder cracking violently.\n\nBE CREATIVE WITH EXTREME ATMOSPHERIC HORROR: Generate unique nightmare scenarios - varied demonic supernatural elements, different horrifying apocalyptic circus scenes with extreme fog and darkness, creative visceral atmospheric terror. Make it GENUINELY SCARY AND DISTURBING with intense macabre atmospheric horror details. Maximum environmental terror without gore.${commonEnding}`;
        
        case "dueno-circo-oscuro":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: VAMPIRE RINGMASTER - Undead demonic circus overlord commanding supernatural darkness and immortal power.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Gothic Victorian vampire ringmaster attire in devil black and deep crimson - elegant tailcoat with occult mystical symbols, cursed ornate top hat, vampire aristocrat Gothic elegance radiating dark supernatural power. CRITICAL: Keep face COMPLETELY BARE - NO makeup, NO face paint, NO fangs added to face. Style hair naturally using THEIR EXACT natural color. The demonic vampire costume creates terror, NOT face alterations.\n\nEXTREME ATMOSPHERIC HORROR ELEMENTS (AI total creative freedom - MAXIMUM TERROR): Ancient vampire circus master ruling SUPERNATURAL CARNIVAL OF ETERNAL DARKNESS. Create apocalyptic supernatural Gothic nightmare. Include INTENSE atmospheric horror: massive glowing ritual circle with mystical pentagrams radiating dark energy, throne constructed entirely from hundreds of human skulls, complete skeletal remains creating Gothic architecture, vampire brides emerging from supernatural shadows with fangs visible and pale undead complexion, demon familiars (hellhounds with glowing eyes, shadow demons, demonic ravens), levitating mystical objects defying gravity, ghostly tormented transparent souls of dead performers screaming silently, ancient occult torture apparatus from dark ages, possessed circus equipment moving autonomously, hellfire portals opening to other dimensions with supernatural glow, massive lightning strikes illuminating destroyed circus tent, graveyard setting with zombie performers rising from earth, sacrificial stone altars with mystical dark energy, cursed artifacts radiating supernatural power, spectral undead performers dancing macabre death waltz. Whip constructed from bone elements. Apocalyptic supernatural thunder storm with heavy fog. Gothic horror vampire aesthetic.\n\nMOOD & AESTHETIC: DRACULA MEETS GOTHIC HORROR OPERA - Extreme vampire atmospheric nightmare. Genuinely terrifying supernatural immortal evil presence. Color palette: Deep crimson, eternal darkness blacks, corpse deathly pale, demonic purples, toxic supernatural greens, ancient bone whites. EXTREME dramatic horror lighting - blood-red full moon glow, hellfire illumination from portals, violent lightning strikes revealing nightmare horrors, flickering candles creating dancing shadows, sharp vampire dramatic shadows, volumetric cursed fog thick with supernatural presence everywhere.\n\nBE CREATIVE WITH MAXIMUM ATMOSPHERIC HORROR: Generate unique vampire Gothic nightmare spectacles - varied demonic supernatural atmospheric terror, different apocalyptic supernatural circus scenes with extreme fog, creative atmospheric horror. Make it GENUINELY TERRIFYING with intense vampire Gothic atmospheric darkness horror.${commonEnding}`;
        
        case "domador-salvaje":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DARK BEAST TAMER - Master commanding SUPERNATURAL WILD BEASTS from mystical dark realm.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Distressed weathered leather tamer outfit with dramatic claw mark details - rugged vest showing beast encounter wear, adventure survivor aesthetic with Gothic elements. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO additions. Style hair naturally wild using THEIR EXACT color/texture. Fearless beast master survivor.\n\nATMOSPHERIC SUPERNATURAL BEAST ELEMENTS (AI creative freedom - TERRIFYING): Dark mystical circus arena with SUPERNATURAL LIVING BIG CATS - massive tigers with GLOWING BRIGHT RED SUPERNATURAL EYES radiating demonic energy, enormous lions with SUPERNATURAL SIZE (much larger than normal) and glowing eyes, black panthers emerging from supernatural fog and shadow portals with eyes glowing, white tigers with mystical supernatural presence and glowing eyes. All beasts ALIVE but possessed by dark supernatural forces - glowing eyes, supernatural auras, dark energy emanating. Create DARK MYSTICAL BEAST ARENA. Include INTENSE atmospheric horror: ancient arena with scattered old human skulls and complete skeletons from centuries past, massive bent iron cages showing supernatural beast strength with huge claw marks in metal, heavy rusted chains, ancient weathered bones scattered throughout, human skulls on old spikes as warnings from ancient times, deep massive claw marks gouged into ancient stone walls, hellfire torches creating dramatic infernal illumination, supernatural demon wolves with glowing eyes circling in shadows, massive swarms of vampire bats creating living tornado, thick EXTREME supernatural fog obscuring everything and hiding lurking predators, violent massive lightning strikes revealing beast silhouettes, supernatural shadow creatures lurking. Underground ancient mystical circus arena. Thunder and supernatural storm with extreme fog.\n\nMOOD & AESTHETIC: MYSTICAL SUPERNATURAL BEAST HORROR - Atmospheric terror with living possessed predators. Dark fantasy beast magic. Color palette: Deep crimsons, eternal blacks, hellfire oranges, supernatural glowing eyes, mystical purples. EXTREME dramatic horror lighting - hellfire casting dancing shadows everywhere, massive lightning flashes revealing beast eyes glowing in darkness, supernatural beast eyes cutting through thick fog, volumetric extreme smoke from hellfire. Primal mystical atmospheric terror.\n\nBE CREATIVE WITH ATMOSPHERIC BEAST HORROR: Generate unique supernatural beast scenarios - varied living possessed predators with different glowing eye colors, different mystical dark arena setups with extreme fog hiding beasts, creative atmospheric terror. Make it GENUINELY TERRIFYING with living supernatural beasts radiating dark mystical power.${commonEnding}`;
        
        case "acrobata-extremo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: CURSED AERIAL PHANTOM - Supernatural possessed aerialist performing in APOCALYPTIC TOWER OF DEATH at nightmare heights.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Heavily torn distressed athletic suit ripped and shredded from fatal falls - death-defying performance wear showing extreme damage, Gothic apocalyptic athletic horror aesthetic. CRITICAL: Keep face COMPLETELY BARE - NO makeup whatsoever. Secure hair naturally using THEIR EXACT natural color. Raw survival against supernatural forces.\n\nEXTREME ATMOSPHERIC HEIGHT HORROR (AI freedom - MAXIMUM TERROR): INSANE DEADLY SUPERNATURAL HEIGHT (60+ feet) suspended over INFINITE DARKNESS AND VOID OF DOOM. Create NIGHTMARE VERTICAL APOCALYPSE WITH EXTREME FOG. Include INTENSE atmospheric horror: ancient rusted industrial rigging covered in decay, SKELETAL REMAINS OF FALLEN AERIALISTS entangled in broken ropes throughout apparatus creating bone garden, complete human skeletons caught in death trap rigging, hundreds of skulls integrated into supernatural death apparatus, massive demon gargoyles with glowing supernatural eyes perched on beams watching and judging, supernatural transparent ghost aerialists performing alongside (translucent spirits of ancient dead performers from past), hellfire burning in infinite darkness far below revealing bottomless pit lined with skulls, VERTICAL GOTHIC CEMETERY with tomb apparatus and floating gravestones, massive violent thunder and lightning strikes hitting metal rigging creating electrical supernatural horror, possessed equipment moving autonomously on its own, heavy rusted chains swinging through void, enormous murder of crows circling the deadly heights creating living tornado, thick supernatural fog obscuring deadly infinite drops everywhere, massive swarms of vampire bats emerging from darkness, shattered platforms showing evidence of previous fatal falls into void. Industrial apocalyptic Gothic horror fusion aesthetic. Vertigo nightmare hell tower suspended in supernatural darkness.\n\nMOOD & AESTHETIC: EXTREME VERTICAL ATMOSPHERIC DEATH HORROR - Genuinely terrifying supernatural heights of eternal doom. Color palette: Deep crimson reds, apocalypse eternal blacks, hellfire oranges from flames in void below, electric supernatural blues from lightning, death decay grays, demonic purples. EXTREME dramatic horror lighting - massive violent lightning strikes illuminating death apparatus and skeletons, hellfire glow from infinite pit of doom far below, harsh upward dramatic spotlights creating demon shadows, electrical sparks from damaged supernatural rigging, volumetric cursed fog everywhere obscuring depths. Thunder cracking violently, heavy rain falling through open apocalyptic hell tower.\n\nBE CREATIVE WITH MAXIMUM ATMOSPHERIC HEIGHT HORROR: Generate unique aerial death atmospheric nightmares - varied skeletal apparatus with extreme fog, different vertical apocalyptic scenarios, creative deadly height atmospheric terror. Make it GENUINELY TERRIFYING with vertigo-inducing atmospheric death horror and supernatural elements.${commonEnding}`;
        
        case "pesadilla-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: GOTHIC WITCH NECROMANCER - Dark sorceress summoning spirits of the dead in CURSED SUPERNATURAL CIRCUS OF LOST SOULS.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Ancient occult mystical circus costume with necromancy elements - Victorian Gothic witch theatrical wear covered in mystical occult symbols, tattered supernatural elegance with dark magic aesthetic. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO shimmer, NO fantasy additions, NO contacts. Style hair naturally wild romantic using THEIR EXACT natural color, can add dead black roses or small bone accessories in hair only. Natural mysterious beauty radiating dark supernatural power.\n\nEXTREME ATMOSPHERIC OCCULT HORROR (AI creative freedom - TERRIFYING): SUPERNATURAL NIGHTMARE CIRCUS APOCALYPSE - ancient necromancy ritual in cursed carnival of lost souls. Include INTENSE atmospheric horror: hundreds of LEVITATING HUMAN SKULLS WITH GLOWING SUPERNATURAL EYES surrounding performer creating orbital pattern, complete SKELETON HANDS reaching upward from earth, massive TRANSPARENT GHOST SPIRITS emerging from thick fog (translucent tortured souls of dead circus performers with anguished faces), zombie undead performers shuffling through darkness with decayed appearance, massive glowing ritual pentagram with mystical energy on floor, floating ancient tarot cards surrounded by supernatural energy, possessed vintage circus props levitating and moving autonomously, giant crystal balls radiating dark energy showing death visions, ancient leather grimoires with demon summoning mystical spells open and floating, ELEGANT VAMPIRE emerging from supernatural shadows with fangs visible and aristocratic presence, werewolf lurking in darkness with glowing eyes, massive demonic black cats with multiple supernatural glowing eyes, enormous murder of ravens carrying human skulls in beaks, thick tornado of vampire bats creating living supernatural vortex, PARTIAL ORNATE DECORATIVE SKULL MASK fused with dead roses and thorns, ancient bones intertwined with dead roses forming Gothic throne, medieval mystical apparatus, Gothic cathedral ancient ruins collapsing dramatically, impossible nightmare architecture defying physics and gravity, shattered mirrors reflecting demonic dimensions and alternate realities, glowing hellfire portals opening to other supernatural realms. Violent thunder, massive lightning strikes, supernatural apocalyptic storm with extreme fog everywhere. Ancient séance summoning demons and spirits.\n\nMOOD & AESTHETIC: CRIMSON PEAK MEETS THE CONJURING - Gothic horror necromancy atmospheric nightmare. Genuinely terrifying supernatural witch atmospheric terror. Beautiful goddess of death and darkness. Color palette: Deep burgundy, eternal death blacks, corpse deathly pale, supernatural mystical teals, demonic hell purples, ancient bone whites, toxic supernatural greens. EXTREME dark fantasy horror lighting - flickering candlelight from skull-shaped candelabras, supernatural colored mystical glows (ghostly ethereal blue, demonic purple, toxic green), blood-red full moon illumination, massive lightning flashes, hellfire from portals, volumetric cursed fog thick with tortured transparent souls everywhere. Painterly atmospheric nightmare aesthetic.\n\nBE CREATIVE WITH MAXIMUM ATMOSPHERIC OCCULT HORROR: Generate unique necromancy atmospheric nightmares - varied supernatural demon summoning with extreme fog, different cursed circus apocalypse scenarios, creative Gothic witch atmospheric terror. Make it GENUINELY TERRIFYING with intense occult atmospheric death horror and beautiful nightmare Gothic elegance.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate ultra-realistic vintage circus characters with theatrical cinema aesthetic, dramatic lighting, and premium photographic quality.${commonEnding}`;
      }
    }
    
    // MODO CLÁSICO
    if (mode === "clasico") {
      switch (style) {
        case "payaso-estrella":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: THEATRICAL STAR CLOWN - Charismatic vibrant performer radiating joy and celebration.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Brilliant colorful theatrical clown costume - vibrant reds, electric blues, golden yellows, rainbow patterns. Pristine festive wear with sparkles and joyful elements. CRITICAL: Keep face COMPLETELY BARE - NO clown makeup, NO face paint, NO dots, NO nose color, NOTHING added to face. Style hair naturally playful using THEIR EXACT natural color. The COSTUME is theatrical, NOT the face.\n\nCREATIVE CELEBRATORY ELEMENTS (AI freedom): Star clown performance with VIBRANT JOYFUL CIRCUS ATMOSPHERE. Include festive circus props: colorful juggling objects, oversized playing cards, balloons, ribbons, vintage circus toys, magic props. Add celebratory touches: confetti, streamers, colorful banners, bright circus lights, festive decorations. Big top circus environment with spectacular celebration - warm bright lighting, colorful atmospheric effects, cheerful circus architecture. Rainbow colors, sparkles, joyful energy everywhere.\n\nMOOD & AESTHETIC: Vibrant circus spectacle full of joy and celebration. Charismatic performer radiating happiness. Color palette: Brilliant reds, electric blues, golden yellows, vibrant oranges, cheerful greens - maximum saturation and brightness. Theatrical lighting - warm powerful spotlights creating golden glow, colored gels creating rainbow effects. Festive atmosphere with sparkle and celebration.\n\nBE CREATIVE: Generate unique joyful circus spectacles - varied colorful props, creative festive carnival staging, celebratory elements. Make it ALEGRE and FESTIVO - beautiful, vibrant, full of happiness and wonder.${commonEnding}`;
        
        case "maestro-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: GRAND RINGMASTER - Magnificent circus master commanding spectacular celebration with elegant grandeur.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Magnificent Victorian ringmaster attire in rich crimson and gold with military details - luxurious commanding elegant presence. CRITICAL: Keep face COMPLETELY BARE - NO makeup whatsoever. Style hair elegantly using THEIR EXACT natural color. Natural authority creates the command.\n\nCREATIVE SPECTACULAR ELEMENTS (AI freedom): Grand ringmaster commanding MAGNIFICENT JOYFUL CIRCUS PERFORMANCE. Create opulent spectacular circus environment with celebration. Include elegant festive elements: ornate baton with jewels, performers in colorful costumes, amazing circus acts (be creative - aerial performers, beautiful animals, acrobats, jugglers), magnificent chandelier with sparkling lights, vintage circus apparatus with golden decorations, festive ornate décor, celebrating audience, rich velvet curtains with gold tassels. Victorian baroque opulence meets grand circus celebration. Confetti, sparkles, warm theatrical lighting creating magic.\n\nMOOD & AESTHETIC: Magnificent celebration - opulent elegant ringmaster commanding spectacular joyful show. Greatest Showman meets grand Victorian circus celebration. Color palette: Rich crimsons, brilliant golds, royal purples, warm ivories, vibrant colors. Theatrical lighting - powerful warm spotlights creating golden glow, brass fixtures gleaming, chandelier sparkling, volumetric light beams creating magical atmosphere. Elegant and spectacular.\n\nBE CREATIVE: Generate unique spectacular presentations - varied colorful circus acts, creative opulent festive staging, magnificent celebratory elegance. Make it ESPECTACULAR and GRANDIOSO with Victorian celebration and joy.${commonEnding}`;
        
        case "domador-legendario":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: LEGENDARY BEAST MASTER - Magnificent tamer with majestic creatures in spectacular bond.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Safari-circus attire with elegant adventure elements - rugged stylish wear suggesting excitement and mastery. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup. Style hair naturally using THEIR EXACT natural color. Natural commanding presence creates the power.\n\nCREATIVE MAJESTIC BEAST ELEMENTS (AI freedom): Legendary tamer with MAGNIFICENT BEAUTIFUL BIG CATS (lions, tigers, leopards - be creative). Create spectacular circus arena with golden lighting. Include elegant beast taming elements: ornate platforms, decorative circus apparatus with golden details, warm torches creating golden glow, festive circus décor, jeweled props. Cats should look powerful, majestic, beautiful - impressive poses, regal presence, magnificent manes. Victorian adventure meets grand circus spectacle. Warm atmospheric lighting, golden hour glow creating magical atmosphere.\n\nMOOD & AESTHETIC: Legendary magnificence - spectacular bond between tamer and majestic beasts. Grand adventure aesthetic. Color palette: Warm golds, rich browns, amber lights, sunset oranges, vibrant circus colors. Dramatic golden hour lighting with warm spotlights - glowing golden skin tones, rim light creating halos, warm light highlighting majestic beasts. Magical warm atmosphere.\n\nBE CREATIVE: Generate unique majestic beast spectacles - varied beautiful cats in different regal poses, creative spectacular arena setups, magnificent circus staging. Make it ESPECTACULAR and LEGENDARIO with majestic powerful beauty.${commonEnding}`;
        
        case "acrobata-profesional":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: SPECTACULAR AERIAL ARTISAN - Elite aerialist performing in brilliant illuminated circus heights.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Designer aerial performance wear in vibrant jewel tones with crystals - elegant athletic elegance with sparkles. CRITICAL: Keep face COMPLETELY BARE - NO makeup whatsoever. Secure hair naturally in simple athletic style using THEIR EXACT natural color. Pure athletic grace speaks for itself.\n\nCREATIVE SPECTACULAR HEIGHTS ELEMENTS (AI freedom): Professional aerial performance suspended HIGH (25+ feet) in BRILLIANTLY LIT CIRCUS THEATER. Create magnificent circus environment with elegant celebratory touches. Include spectacular aerial elements: apparatus with golden decorations, elegant silk fabrics in vibrant colors, illuminated heights with warm spotlights, grand circus ceiling with chandeliers. Add spectacular beauty: crystals catching rainbow lights, chalk powder creating magical sparkle effects, warm theatrical lighting, elegant architecture. Other aerialists creating beautiful ensemble in coordinated performance. Elite artistry - Cirque du Soleil meets grand celebration performance.\n\nMOOD & AESTHETIC: Elite magnificence - superhuman grace in spectacular heights. Brilliant theatrical elegance. Color palette: Sapphire blues, royal purples, rose golds, vibrant reds, warm ivories. World-class theatrical lighting - powerful warm spotlights on performer, vibrant colored spotlights (cyan, magenta, amber, gold) creating colorful separation, warm glow, volumetric beams through atmospheric sparkle. Crystals exploding with rainbow light.\n\nBE CREATIVE: Generate unique spectacular aerial art - varied graceful poses in brilliant light, different magnificent theater setups, creative elegant illuminated heights. Make it ESPECTACULAR and ELEGANTE with brilliant theatrical beauty and celebration.${commonEnding}`;
        
        case "artista-espectaculo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: SPECTACULAR FINALE STAR - Ultimate showman/showwoman in peak joyful circus finale explosion moment.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Show-stopping spectacular performance costume covered in sequins, crystals, vibrant jewel tones - maximum dramatic celebratory impact with dazzling elegance. CRITICAL: Keep face COMPLETELY BARE - NO makeup, NO glitter, NO face decorations whatsoever. Style hair naturally with volume using THEIR EXACT natural color. The spectacular costume creates ALL the glamour.\n\nCREATIVE SPECTACULAR FINALE (AI freedom): Ultimate finale performer in EXPLOSIVE PEAK CELEBRATION MOMENT with GRAND CIRCUS MAGNIFICENCE. Create massive finale celebration with spectacular joyful elements. Include amazing finale effects: rainbow confetti explosion, pyrotechnic sparklers creating golden light trails, colorful smoke effects, flying celebration elements (doves, balloons, ribbons, flower petals), grand circus stage with ornate golden details, celebrating audience cheering, colorful balloons and streamers everywhere, festive circus apparatus. Broadway finale meets grand circus celebration maximum spectacle. Vibrant brilliant colors - jewel tones, rainbow spectrum, golden sparkles, colorful lights. Theatrical joyful chaos with magnificent beauty. Captured at absolute PEAK celebratory triumph moment full of happiness.\n\nMOOD & AESTHETIC: Spectacular celebration - maximum finale glory with grand circus magnificence. Greatest Showman finale meets vibrant carnival spectacular joy. Color palette: Emerald greens, royal purples, sunset golds, hot pinks, electric blues, vibrant reds - MAXIMUM SATURATION AND BRIGHTNESS. Theatrical lighting MAXIMUM - multiple powerful warm spotlights creating goddess/god lighting, colored brilliant lights creating rainbow effects, sparklers creating golden practical light, volumetric beams through confetti-filled air creating magic. Absolute spectacle with magnificent joyful elegance.\n\nBE CREATIVE: Generate unique spectacular joyful finales - varied explosive celebration effects, creative magnificent circus staging, spectacular celebratory grandeur. Make it ESPECTACULAR and MAGNIFICO - pure celebration, joy, wonder, and theatrical magic at absolute peak.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate ultra-realistic classic circus characters with vibrant saturated colors, warm theatrical lighting, and premium editorial photography quality.${commonEnding}`;
      }
    }
    
    // Fallback
    return `${baseInstructions}\n\nCreate breathtaking, cinema-quality circus character portraits with professional cinematography, dramatic theatrical lighting, and editorial photography standards.${commonEnding}`;
  };

  // Función para capturar la imagen desde el componente WebcamScene
  const handleCapture = async () => {
    if (webcamRef.current && webcamRef.current.captureImage) {
      try {
        const blob = await webcamRef.current.captureImage();
        setCapturedImage(blob);
        const url = URL.createObjectURL(blob);
        setCapturedImageUrl(url);
      } catch (error) {
        console.error("Error al capturar la imagen:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo capturar la imagen. Inténtalo de nuevo.",
        });
      }
    }
  };

  // Handler para cambio de modo (resetea el estilo seleccionado)
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    // Para "fondo-terrorifico" asignar estilo automático, para otros resetear
    if (mode === "fondo-terrorifico") {
      setSelectedStyle("background-only"); // Estilo dummy para este modo
    } else {
      setSelectedStyle(""); // Resetear estilo al cambiar de modo
    }
  };

  // Procesa la imagen con el prompt del modo y estilo seleccionado
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      console.log("🚀 Procesando imagen con IA...");
      console.log(`🎭 Modo: ${selectedMode}, Estilo: ${selectedStyle}`);
      
      // Convertir la imagen original (capturedImage) a data URL para pasarla al parent
      const reader = new FileReader();
      const originalImageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });
      
      // Cambiar INMEDIATAMENTE a la pantalla de espera sin esperar
      onProcess(email);
      
      // Procesar la imagen en background con prompt basado en modo y estilo
      const prompt = getPromptByStyle(selectedMode, selectedStyle);
      console.log(`📝 Prompt generado para transformación realista con logo`);
      
      // Usar nano-banana con imagen + URL del logo
      const model = "google/nano-banana";
      console.log(`🤖 Usando modelo: ${model}`);
      console.log(`🖼️ Enviando imagen de usuario + URL del logo: ${CIRCUS_LOGO_URL}`);
      
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        selectedStyle,
        "user-" + Date.now(),
        model,
        CIRCUS_LOGO_URL  // Pasar la URL del logo directamente
      );

      if (result.success && result.imageUrl) {
        console.log("✅ Imagen generada exitosamente:", result.imageUrl);
        // Pasar tanto la imagen generada como la original al parent
        onAiImageReady(result.imageUrl, originalImageDataUrl);
        
      } else {
        console.error("❌ Error al generar imagen:", result.error);
      }

    } catch (error) {
      console.error("❌ Error al procesar la imagen:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función temporal para pruebass con imagen fija
  
  const handleTestWithFixedImage = () => {
    const testImageUrl = "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/CasaReina1%2F-1773594771102.png?alt=media&token=732ba120-4f1e-4b39-a219-210ef29ee09e";
    const testOriginalImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // Imagen de prueba 1x1
    
    console.log("🧪 Iniciando prueba con imagen fija:", testImageUrl);
    
    // Cambiar inmediatamente al formulario
    onProcess(email);
    
    // Simular un breve delay y luego notificar que la imagen está lista
    setTimeout(() => {
      console.log("🧪 Imagen de prueba lista");
      onAiImageReady(testImageUrl, testOriginalImageUrl);
    }, 1000); // 2 segundos de delay para simular procesamiento
  };


  // Permite reiniciar la captura para tomar otra foto
  const handleResetCapture = () => {
    setCapturedImage(null);
    setCapturedImageUrl("");
    setSelectedMode("");
    setSelectedStyle("");
  };

  // Validación del formulario y envío de la imagen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Primero toma una foto.",
      });
      return;
    }

    if (!selectedMode) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un modo (Terror, Clásico o Fondo Terrorífico).",
      });
      return;
    }

    // Solo validar estilo si no es el modo "fondo-terrorifico"
    if (selectedMode !== "fondo-terrorifico" && !selectedStyle) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un estilo de personaje.",
      });
      return;
    }

    if (isProcessing) {
      return; // Evitar múltiples envíos
    }

    handleProcessImage();
  };

  return (
    <div className="container">
      {/* Cabecera superior con fondo rojo y logo centrado */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* <img src={fondo} alt="Fondo" className="fondo" /> */}
      <div className="main-content">
        <div className="card">
          {/* <h2 className="subtitle">AVATAR AI</h2> */}
          <div className="avatar-container cam">
            {capturedImageUrl ? (
              // Si ya se capturó la imagen, se muestra la imagen fija
              <img
                src={capturedImageUrl}
                alt="Foto capturada"
                className="fotoCapturada"
              />
            ) : (
              // Si no, se muestra el feed en vivo de la cámara
              <WebcamScene ref={webcamRef} />
            )}
          </div>

          <div className="buttons-container">
            {/* Selector de MODO */}
            <div className="select-container">
              <select
                value={selectedMode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="input"
                required
              >
                <option value="" disabled>
                  Selecciona Modo
                </option>
                <option value="terror">😈 MODO TERROR</option>
                <option value="clasico">✨ MODO CLÁSICO</option>
                <option value="fondo-terrorifico">🎃 FONDO TERRORÍFICO</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

            {/* Selector de ESTILO (condicional según el modo) */}
            {selectedMode && selectedMode !== "fondo-terrorifico" && (
              <div className="select-container">
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="input"
                  required
                >
                  <option value="" disabled>
                    Selecciona Personaje
                  </option>
                  {selectedMode === "terror" && (
                    <>
                      <option value="payaso-maldito">🤡 Payaso Maldito</option>
                      <option value="dueno-circo-oscuro">🎪 Dueño del Circo Oscuro</option>
                      <option value="domador-salvaje">🦁 Domador Salvaje</option>
                      <option value="acrobata-extremo">🎭 Acróbata Extremo</option>
                      <option value="pesadilla-circo">👻 Pesadilla del Circo</option>
                    </>
                  )}
                  {selectedMode === "clasico" && (
                    <>
                      <option value="payaso-estrella">🤡 Payaso Estrella</option>
                      <option value="maestro-circo">🎪 Gran Maestro del Circo</option>
                      <option value="domador-legendario">🦁 Domador Legendario</option>
                      <option value="acrobata-profesional">🎭 Acróbata Profesional</option>
                      <option value="artista-espectaculo">🎟️ Artista del Espectáculo</option>
                    </>
                  )}
                </select>
                <span className="select-arrow">▼</span>
              </div>
            )}

            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
              disabled={isProcessing}
            >
              {capturedImageUrl ? "Tomar otra" : "Tomar foto"}
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="button"
              disabled={!capturedImageUrl || isProcessing}
            >
              {isProcessing ? "Generando..." : "Procesar"}
            </button>
            
            {/* Botón temporal para pruebas */}
            {<button
              type="button"
              className="button test-button"
              onClick={handleTestWithFixedImage}
              style={{ 
                marginTop: "10px",
                backgroundColor: "#ff9900",
                fontSize: "14px",
                display: "block",
              }}
            >
              🧪 PRUEBA CON IMAGEN FIJA
            </button> }
          </form>
        </div>
      </div>

      
    </div>
  );
};

export default AvatarPhoto;
