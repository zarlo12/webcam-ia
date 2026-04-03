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
          return `${baseInstructions}\n\nCIRCUS CHARACTER: SINISTER VINTAGE CLOWN - Dark carnival performer from nightmare circus.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Distressed vintage clown costume in dark tones - weathered fabrics, torn elements, aged theatrical wear. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO face paint, NO additions whatsoever. Style hair naturally using THEIR EXACT natural color/texture. The COSTUME creates the character, NOT the face.\n\nCREATIVE ELEMENTS (AI has freedom to choose and create): Sinister circus props and atmosphere - think vintage horror carnival. Include dark, unsettling elements: aged dolls, weathered toys, mysterious objects, playing cards, vintage circus items. Add macabre touches: skulls, bones, dark creatures (ravens, bats, black cats), shadowy silhouettes. Create ominous abandoned circus environment with gothic Victorian aesthetic. Atmospheric fog, dramatic shadows, eerie lighting effects.\n\nMOOD & AESTHETIC: Dark carnival horror - Tim Burton meets haunted circus. Disturbing beauty, elegant darkness, mysterious terror. Color palette: Deep reds, midnight blacks, dark purples, sickly greens, shadow grays. Dramatic film noir lighting with colored gels creating ominous atmosphere. Volumetric fog, dust particles in light beams.\n\nBE CREATIVE: Generate unique variations - different sinister props, varied dark circus elements, creative scary compositions. Make it TENEBROSO each time with fresh macabre details.${commonEnding}`;
        
        case "dueno-circo-oscuro":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DARK RINGMASTER - Sinister circus master commanding forces of darkness.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Elegant Victorian ringmaster attire in black and crimson - dramatic tailcoat, top hat, commanding presence. CRITICAL: Keep face COMPLETELY BARE - NO makeup, NO face paint. Style hair naturally using THEIR EXACT natural color. The commanding costume creates authority, NOT face alterations.\n\nCREATIVE DARK ELEMENTS (AI freedom): Master of dark circus - create ominous supernatural atmosphere. Include sinister elements: ornate cane or whip with mystical properties, supernatural effects (ghostly flames, levitating objects), dark creatures (ravens, shadows, spectral figures). Victorian gothic circus environment - midnight stage with macabre decorations. Add skulls, bones, dark artifacts, mysterious symbols, haunted circus apparatus. Dramatic shadows and silhouettes suggesting dark powers.\n\nMOOD & AESTHETIC: Victorian gothic horror meets dark opera. Commanding elegance with sinister undertones. Supernatural authority. Color palette: Midnight blacks, blood crimsons, deep purples, ghostly blues, shadow grays. Dramatic noir lighting - sharp shadows, mysterious glows, moonlight, flickering flames. Volumetric fog creating supernatural atmosphere.\n\nBE CREATIVE: Generate unique dark spectacles - varied supernatural effects, different sinister props, creative macabre staging. Make it TENEBROSO and commanding with gothic grandeur.${commonEnding}`;
        
        case "domador-salvaje":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DANGEROUS BEAST TAMER - Fearless master of savage creatures in dark circus arena.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Rugged distressed leather tamer outfit showing battle wear - weathered vest, worn clothing, protective gear. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO additions. Style hair naturally wind-swept using THEIR EXACT color/texture. Raw natural appearance emphasizes real courage.\n\nCREATIVE DARK ELEMENTS (AI freedom): Dangerous circus performance with SAVAGE BIG CATS (tigers, lions, panthers - be creative with species and poses). Create threatening dramatic atmosphere - snarling beasts, intense confrontation, raw power. Include dark circus elements: iron cages, heavy chains, fire torches, dramatic shadows, atmospheric smoke. Add macabre touches: skulls, bones scattered in arena, ominous circus apparatus, sinister vintage props. Gritty dangerous environment - 1930s horror circus aesthetic.\n\nMOOD & AESTHETIC: Raw brutal courage meets dark carnival danger. Life-or-death performance. Gritty film noir atmosphere. Color palette: Charcoal blacks, deep browns, blood reds, fire oranges, amber flames, shadow grays. Harsh dramatic lighting - powerful contrasts, glowing beast eyes, firelight, volumetric smoke. Primal intensity.\n\nBE CREATIVE: Generate unique dangerous spectacles - varied savage beasts, different threatening poses, creative dark circus staging. Make it TENEBROSO and intense with palpable danger.${commonEnding}`;
        
        case "acrobata-extremo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DEATH-DEFYING AERIALIST - Extreme performer flying through darkness at terrifying heights.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Dark athletic performance wear - form-fitting suit in blacks, deep colors, gothic athletic aesthetic. CRITICAL: Keep face COMPLETELY BARE - NO makeup whatsoever. Secure hair naturally in simple style using THEIR EXACT natural color. Raw athleticism speaks for itself.\n\nCREATIVE DARK ELEMENTS (AI freedom): EXTREME HEIGHT aerial performance (40+ feet high) - spectacular mid-air stunts, death-defying poses. Create dangerous dark circus atmosphere overhead. Include ominous elements: industrial rigging, exposed beams, hanging chains, shadowy heights, vertiginous drop. Add macabre touches: skulls integrated into apparatus, dark Gothic decorations on rigging, sinister circus elements suspended in darkness. Electric/fire effects, dramatic sparks, supernatural lighting. Cyberpunk-gothic fusion. Dark arena far below with tiny audience silhouettes.\n\nMOOD & AESTHETIC: Extreme danger meets dark spectacle. Vertigo-inducing height, supernatural athleticism. Gothic cyberpunk circus. Color palette: Midnight blacks, electric blues, neon magentas, blood reds, shadow purples. Dramatic upward spotlights, colored backlights, volumetric light beams through darkness. Suspended dust and chalk powder catching eerie light.\n\nBE CREATIVE: Generate unique aerial nightmares - varied death-defying poses, different dark rigging setups, creative ominous heights. Make it TENEBROSO and vertigo-inducing with Gothic intensity.${commonEnding}`;
        
        case "pesadilla-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DARK FANTASY ENCHANTER - Mysterious supernatural performer from nightmare fairytale circus.\n\nCOSTUME - 100% NATURAL FACE (NO MAKEUP): Surreal vintage circus costume with dark fantasy elements - aged theatrical wear mixing elegance and darkness. CRITICAL: Keep face COMPLETELY BARE and natural - NO makeup, NO shimmer, NO fantasy additions, NO contacts. Style hair naturally romantic using THEIR EXACT natural color, can add flower accessories in hair only. Natural enigmatic beauty creates the mystique.\n\nCREATIVE DARK FANTASY ELEMENTS (AI freedom): Supernatural circus dreamscape - create magical yet ominous atmosphere. Include dark mystical elements: partial ornate mask revealing face, floating circus props (cards, objects levitating), magical effects (colored smoke, glowing orbs, supernatural wisps). Dark fantasy familiars: ravens, black cats, bats, dark butterflies, mysterious creatures. Add macabre beauty: skulls with flowers, bones intertwined with roses, vintage circus items with sinister twist, crystal balls, ancient books, occult symbols. Surreal distorted circus environment - impossible perspectives, Gothic architecture, aged mirrors, baroque details.\n\nMOOD & AESTHETIC: Dark fantasy horror meets haunted circus romance. Pan's Labyrinth meets Crimson Peak. Beautiful yet unsettling. Supernatural elegance. Color palette: Deep teals, burgundy reds, midnight blues, old golds, shadow grays, ash blacks. Surreal painterly lighting - unusual colored lights, candlelight, supernatural glows, volumetric fog. Magical realism with sinister undertones.\n\nBE CREATIVE: Generate unique dark fantasy scenes - varied supernatural elements, different mystical props, creative haunting compositions. Make it TENEBROSO and enchanting with Gothic fairy tale darkness.${commonEnding}`;
        
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
