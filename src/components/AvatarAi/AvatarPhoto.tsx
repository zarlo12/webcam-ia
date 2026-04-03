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

  // Función para generar el prompt basado en el modo y estilo seleccionado
  const getPromptByStyle = (mode: string, style: string): string => {
    const baseInstructions = `PHOTOREALISTIC PORTRAIT SESSION - ABSOLUTE FACE PRESERVATION CRITICAL: This is a professional photo shoot of the EXACT person from the input image wearing a circus-themed costume. You are ONLY changing their outfit and background - NOTHING ELSE.

⚠️ CRITICAL IDENTITY PRESERVATION RULES (HIGHEST PRIORITY - NON-NEGOTIABLE):
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
- The person MUST be IMMEDIATELY and OBVIOUSLY recognizable as themselves - family and friends should recognize them instantly

🎭 MAKEUP & STYLING RULES (MINIMAL CHANGES ONLY):
- If theatrical makeup is needed: Apply it VERY SUBTLY and LIGHTLY over their existing features
- Use TRANSLUCENT/SHEER makeup that enhances rather than covers their natural features
- Preserve visibility of their natural skin texture and tone underneath any makeup
- NO heavy foundation that changes their skin appearance
- Eye makeup: subtle enhancement only, NO dramatic color changes
- Lip color: stay within 1-2 shades of their natural lip color
- Hair styling: ONLY gentle styling (combing, slight volume) - NEVER change color, never change texture

🎪 CIRCUS TRANSFORMATION APPROACH:
You are creating a professional portrait photo where THIS SPECIFIC PERSON is wearing a circus costume for a themed photoshoot. Think: Actor headshot in costume, NOT character replacement. The costume, props, lighting, and background create the circus theme - their face remains untouched and natural.`;
    
    const commonEnding = `\n\n🚨 FINAL CRITICAL REMINDER - ABSOLUTE FACE PRESERVATION:
This is portrait photography of THIS EXACT REAL PERSON in a circus costume. Their ENTIRE FACE must remain 100% IDENTICAL to the input photo:
- Their EXACT face shape, bone structure, proportions
- Their EXACT eyes (color, shape, spacing), nose (exact shape), mouth (exact shape)  
- Their EXACT skin tone and texture
- Their EXACT natural hair (color, texture, length) - only gently styled, NEVER changed
- NO face morphing, NO feature alterations, NO cosmetic changes
- They must look EXACTLY like themselves - instantly recognizable to anyone who knows them

Only change: Costume worn, background/environment, and professional photographic lighting. Think: Professional costume photoshoot, NOT face transformation.

LIGHTING: Three-point lighting setup with dramatic key light, soft fill, vibrant rim light. Volumetric fog/haze catching light rays. Cinematic color grading with rich saturated colors, deep blacks, glowing highlights.

COMPOSITION: Vertical 9:16 mobile format. Rule of thirds positioning, dynamic pose, eye contact with camera. Immersive themed background with atmospheric depth, practical lights, environmental details.

QUALITY: Magazine cover quality, Vogue/Vanity Fair editorial standard. Professional retouching maintaining natural skin texture, enhanced eye catchlights, subtle lens flare, film grain.

Multiple people: Apply same costume/theme to each while preserving EVERY person's unique facial identity 100% exactly and position.

STRICTLY AVOID: Changing ANY facial features, face shape, eye color/shape, nose shape, lip shape, skin tone, hair color/texture. No cartoon/anime style, no distorted anatomy, no extra limbs, no merged faces, no duplicate people, no text/watermarks, no plastic/overly smooth skin. Keep it 100% photorealistic with their REAL unchanged face.`;
    
    // MODO TERROR
    if (mode === "terror") {
      switch (style) {
        case "payaso-maldito":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: THEATRICAL VINTAGE CLOWN (Victorian circus aesthetic). Photograph THIS PERSON dressed as a dramatic mysterious clown performer.\n\nCOSTUME & STYLING: Distressed Victorian-era clown costume - weathered burgundy and midnight black silks, torn tulle ruffles, antique brass buttons, oxidized silver chains. Realistic fabric wear with frayed edges and authentic aging. MAKEUP APPLICATION (MINIMAL - preserve their natural face 100%): Very light, translucent theatrical makeup - subtle touches only: light dusty powder around eyes for mystery (NOT heavy/dramatic), soft burgundy lip tint staying within THEIR natural lip color range, small decorative painted accent on ONE cheek (tiny dot or small symbol). Keep THEIR natural skin tone, texture, and facial features completely visible. NO white face paint, NO exaggerated features, NO painted smiles. Their natural face must show through clearly. HAIR STYLING: GENTLY style THEIR EXISTING HAIR with minimal product - keep THEIR EXACT natural hair color, keep THEIR EXACT hair texture, just add light tousled styling. NO wigs, NO color changes, NO dramatic transformations - just natural windswept look.\n\nACTION & PROPS: Holding vintage circus props in dramatic way - aged performance knives, antique porcelain doll, weathered playing cards floating mid-air around them, vintage jack-in-the-box with puppet emerging. EXPRESSION: Capture THEIR natural expression with mysterious charisma - slight head tilt, intense gaze toward camera, subtle enigmatic smile showing hint of teeth. ENVIRONMENT: Vintage 1920s circus tent during dramatic storm - tattered red velvet curtains blowing in wind, weathered vintage wooden props scattered, antique carousel horses with aged peeling paint, vintage circus posters with artistic distressing, dusty amber light shafts cutting through atmosphere, volumetric fog on weathered floor, ravens perched on old tent poles, atmospheric haze catching light. Background: Silhouettes of vintage circus apparatus, aged mirrors reflecting fragmented light, old seats with dramatic shadows. LIGHTING: Single antique spotlight with warm tungsten creating dramatic shadows, purple and deep red gel side lights (film noir atmosphere), lightning flash from tent opening creating backlight, practical oil lamp creating warm glow on props. Dust particles and fog catching colored light beams. CINEMATOGRAPHY: f/2.0 shallow DoF keeping THEIR FACE razor sharp, slight low-angle adding drama, subtle vignette darkening edges. Color palette: Desaturated reds (#8B0000), purples (#4B0082), deep greens (#2F4F2F), rust oranges. Tim Burton meets Guillermo del Toro aesthetic - theatrical vintage charm.${commonEnding}`;
        
        case "dueno-circo-oscuro":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: GOTHIC RINGMASTER (Victorian Gothic Opera aesthetic). Photograph THIS PERSON dressed as an elegant commanding circus master.\n\nCOSTUME & STYLING: Museum-quality Victorian ringmaster tailcoat - midnight black wool with deep crimson velvet lapels, intricate gold embroidery, matching waistcoat with antique brass buttons, crisp white high-collar shirt, black silk cravat with decorative antique pin. Tall top hat with burgundy band and raven feather. White leather gloves. ACCESSORIES: Ornate ebony cane with silver ornate handle topped with glowing crystal, vintage leather bullwhip coiled elegantly, antique pocket watch with mysterious melody. GROOMING: Style THEIR HAIR neatly using THEIR EXACT natural hair color and texture (just comb/brush naturally), groom any existing facial hair precisely maintaining THEIR natural look. MINIMAL makeup: barely-there translucent powder if needed for photography. Keep THEIR completely natural appearance - the costume creates the character, not face changes.\n\nACTION & SPECTACLE: Captured mid-command gesture - whip extended with supernatural blue flame trailing from tip, or cane raised commanding shadowy figures. Ravens circling overhead with spread wings, enchanted circus props levitating around them (floating top hats, dancing canes, spinning rings of fire). EXPRESSION: Capture THEIR commanding presence - raised chin, penetrating gaze from THEIR eyes, hint of knowing smile on THEIR lips, aura of dark charisma. Authoritative stance with hand extended holding cane/whip, other hand gesturing with theatrical showmanship. ENVIRONMENT: Victorian circus main stage at midnight - grand proscenium arch with carved ornate details, heavy crimson velvet curtains billowing dramatically, antique gas lamps flickering with green/blue flames, theatrical haze on polished wooden stage creating mystery. Background spectacle: Dramatic silhouettes of performers in shadows, vintage audience in Victorian formal wear (soft focus), ornate circus wagons with decorative carvings, hanging aerial silks swaying mysteriously, grand chandelier with candles, gothic arched windows showing full moon, trained ravens perched on baroque frames. LIGHTING: Dramatic theatrical noir - powerful key from above creating sharp shadows on THEIR FACE (following bone structure), crimson gel backlights creating glowing rim around figure, purple/blue accent floor lights creating upward shadows and mystery, warm practical gas lamp creating amber pools, moonlight shafts through windows. Volumetric fog catching colored light beams, dust particles dancing in light. CINEMATOGRAPHY: Slightly low angle emphasizing authority and power, f/2.2 shallow DoF, rich crushed blacks with glowing highlights. Bleach bypass color grade with pushed reds/golds, desaturated shadows. Crimson Peak meets Phantom of the Opera aesthetic - Victorian gothic elegance.${commonEnding}`;
        
        case "domador-salvaje":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: EXOTIC ANIMAL TAMER (Adventure cinema meets 1930s Circus Acts). Photograph THIS PERSON dressed as an experienced fearless animal tamer in peak performance moment.\n\nCOSTUME & STYLING: Distressed genuine leather ensemble - worn brown leather vest with visible claw scratches/repairs, weathered cotton shirt with rolled sleeves, thick leather belt with brass buckle, dark fitted pants in tall leather boots with metal buckles. Protective leather arm guards with metal studs and brass rivets showing authentic wear. Heavy leather gloves. ACCESSORIES: Braided leather whip extended mid-crack with motion blur on tip, heavy brass/steel chains draped over shoulder, leather bandolier, brass whistle on chain. APPEARANCE: Keep THEIR 100% natural facial features and exact skin tone. Style THEIR HAIR naturally wind-swept (using THEIR EXACT natural hair color/texture - just tousled, no products). NO makeup changes - keep their completely natural face. Lighting can suggest atmosphere, but their face stays natural and unchanged. Natural skin texture visible.\n\nACTION & EXOTIC SPECTACLE: CRITICAL - Photograph them in commanding stance with THREE MAGNIFICENT BENGAL TIGERS in dramatic poses around them: One massive tiger on raised platform with mouth open showing fangs (powerful expression), second tiger prowling gracefully on opposite side with glowing eyes, third tiger standing on hind legs with front paws raised. Person captured mid-whip crack in commanding pose - whip extended toward tigers, fearless commanding posture, confident presence. EXOTIC CATS ARE ESSENTIAL - tigers must be clearly visible, detailed, photorealistic, showing their majesty and power. EXPRESSION: Capture THEIR confident, fearless demeanor - intense eye contact from THEIR eyes toward camera, determined expression on THEIR face, jaw set, powerful confident stance showing mastery. Captured mid-motion - dynamic power pose. ENVIRONMENT: Dramatic 1930s circus performance arena at night - reinforced iron cage with thick bars catching rim light, heavy chains from ceiling, scattered straw on worn wooden floor, dramatic shadows, atmospheric smoke/dust in air from movement. Vintage circus apparatus - metal chairs, pedestals, wooden platforms at different heights where tigers pose. Weathered circus ring floor with tiger paw prints in dust. Background: Torch sconces on cage bars, vintage circus posters with dramatic imagery, distant audience silhouettes watching behind safety barriers. LIGHTING: Gritty high-contrast film noir - harsh side key creating dramatic shadows following THEIR cheekbone structure, minimal fill for dramatic mood, powerful orange/amber rim light separating them from darkness, tiger eyes reflecting light with glowing intensity, smoke/dust catching amber light. Multiple practical torches/lanterns creating fire-lit atmosphere, spotlight from above creating god rays through haze. Color palette: Desaturated browns, deep oranges, charcoal blacks, splashes of deep red, amber firelight, tiger orange and black stripes catching light. CINEMATOGRAPHY: Eye-level dynamic angle capturing power, f/2.0 shallow DoF keeping THEIR FACE razor-sharp with tigers slightly softer in background/sides, slight motion blur on whip mid-crack, heavy gritty film grain. The Revenant meets Peaky Blinders meets Life of Pi circus aesthetic. Maximum excitement, maximum courage, epic performance frozen in time.${commonEnding}`;
        
        case "acrobata-extremo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: EXTREME AERIAL ACROBAT (Cirque du Soleil meets Cyberpunk aesthetic). Photograph THIS PERSON as a gravity-defying performer in spectacular aerial performance.\n\nCOSTUME & STYLING: Form-fitting performance suit in technical fabrics - midnight black athletic material with burgundy and electric blue geometric patterns, strategic mesh panels, industrial silver zippers and hardware, leather straps crisscrossing torso and thighs, metallic studs along seams. Gothic athletic aesthetic. Wrapped hands/wrists with black athletic tape, bare feet or minimal aerial shoes. THEIR natural athletic physique emphasized by costume fit and dramatic lighting. HAIR STYLING: Style THEIR HAIR secured back naturally for aerial performance (keeping THEIR EXACT natural color and texture) - just pulled back in simple ponytail/bun using their own hair, NO added pieces, NO color changes. Simple and natural athletic hairstyle.\n\nEXTREME ACTION & HEIGHT: Suspended 40+ feet in air performing SPECTACULAR STUNT - captured mid-aerial trick in one of these dramatic poses: 1) Horizontal split while holding aerial silk with one hand, other arm extended toward camera in beautiful arc, or 2) Inverted hang from trapeze bar by knees, arms spread wide, or 3) Spectacular back arch suspended only by ankle wraps with arms flowing. THEIR hair and silk fabrics flowing with motion showing speed and grace. Slight motion blur on moving elements (silks, hair) while THEIR FACE stays razor-sharp. Electric sparks or ember trails following their path through air (theatrical effects). Other aerial apparatuses visible at different heights - multiple performers mid-flight in background creating spectacle. EXPRESSION: Capture THEIR intense focus mixed with performance adrenaline - THEIR eyes locked fiercely on camera showing confidence, face showing concentration and thrill of extreme height, slight adventurous smile, warrior focus. ENVIRONMENT: High above massive dark circus arena showing EXTREME VERTICAL DROP - camera angle emphasizing terrifying height, arena floor FAR below (40+ feet) with tiny silhouettes of awestruck audience visible, distant ring floor, safety net barely visible below. Aerial equipment creating web of danger - multiple trapeze bars, crossing aerial silks in deep red/black/electric blue, suspended hoops, rope ladders, all at different heights creating depth. Industrial circus ceiling with exposed steel beams, professional rigging, catwalks with crew silhouettes, hanging chain mechanisms. Lightning or electrical effects in background. LIGHTING: Extreme theatrical aerial lighting - powerful spotlights from below creating dramatic upward illumination and long shadows, cyan and magenta backlights creating electric glow on fabric and body edges, volumetric light beams cutting through darkness revealing suspended chalk powder and mist, rim lighting outlining every muscle and fabric fold. Practical pyrotechnic trails, strobe effects freezing motion, neon accent lights on rigging. Color-changing LED strips on silks. CINEMATOGRAPHY: Dynamic perspective with extreme vertigo sense - looking up from below showing terrifying height, shallow DoF with background arena dissolving into bokeh, f/2.2 aperture creating beautiful colored orbs from distant lights. Color grade: Cyberpunk-circus meets Tron - deep blues (#000080), electric cyans (#00FFFF), vibrant magentas (#FF00FF), neon purples, rich blacks. Blade Runner 2049 meets Cirque du Soleil KÀ aesthetic. Breathtaking spectacle, superhuman performance, thrilling atmosphere.${commonEnding}`;
        
        case "pesadilla-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: FANTASY CIRCUS PERFORMER (Pan's Labyrinth meets Crimson Peak aesthetic). Photograph THIS PERSON as an otherworldly, mysterious beautiful circus performer from fantasy fairytale realm.\n\nCOSTUME & STYLING: Surreal fusion of vintage circus and fantasy - aged burgundy and black performance costume with supernatural elements: Victorian lace layered with vintage leather, antique keys on tarnished silver chains, small aged mirrors reflecting light, circus canvas strips, preserved flowers (roses, dahlias, orchids) woven throughout costume creating romantic aesthetic. Elegant theatrical styling mixing beauty and vintage charm. MAKEUP & EFFECTS (VERY MINIMAL - preserve THEIR face 100%): Keep THEIR completely natural face - NO foundation color changes, NO contouring, NO dramatic eye makeup. Only: subtle natural-toned shimmer on THEIR cheekbones if needed, lips in THEIR natural color tone. NO contacts, NO prosthetics, NO fantasy alterations to face. Their natural beauty creates the character. HAIR: Style THEIR EXISTING HAIR gently with natural romantic styling (maintaining THEIR EXACT natural color - just add soft braids, flowers as accessories, gentle waves using THEIR natural texture). NO wigs, NO color changes.\n\nFANTASY SPECTACLE & PROPS: THEATRICAL ELEMENTS creating dreamlike atmosphere - Ornate Venetian/masquerade mask (half-face revealing THEIR features), vintage circus props transformed (juggling clubs floating mid-air, antique music box with ballerina, aged playing cards suspended around them, pocket watch frozen at midnight). Fantasy familiars: Black raven with spread wings perched on shoulder or hand, or elegant black cat at their feet, or dark butterflies landing on hand. Magical elements: Wisps of colored smoke (purple/teal) around fingers suggesting magic, small floating orbs of light, flower petals suspended mid-air. ACCESSORIES: Beautiful objects - ornate hand mirror, vintage circus apparatus, aged book, crystal ball with swirling mist, candelabra. EXPRESSION: Capture THEIR enigmatic presence - mysterious head tilt showing elegant neck, THEIR direct gaze locked on camera with ancient wisdom in eyes, expression perfectly balanced between serene beauty and subtle mystery, knowing smile suggesting mysterious secrets. Regal yet mysterious composure. ENVIRONMENT: Surreal fantasy circus creating dreamscape - distorted perspective with Escher-inspired impossible geometry, vintage circus elements in beautiful aged condition (gilt mirrors with artistic cracks, faded circus posters showing vintage performers, carousel horses with artistic patina, aged apparatus decorated with roses). Volumetric fog on floor, practical candles and antique lanterns creating pools of warm light. Blurred surreal floating elements creating magical realism: Circus props (hoops, ribbons, flowers) suspended mid-air, fabric strips flowing upward, playing cards creating spiral, clock gears floating, vintage photographs. Theatrical architectural elements - arched doorways, baroque frames, ornate columns, velvet curtains. LIGHTING: Surreal painterly setup - key light with unusual color (soft green #90EE90, deep purple #4B0082, or cyan #00FFCC) creating otherworldly glow on THEIR FACE, multiple colored rim lights from artistic angles (purple from below, gold from side, green from above) creating separation and mystery, practical warm candlelight creating contrast and intimate pools of amber, atmospheric haze catching ALL colored light beams creating magical realism and volumetric effects. Light appearing from impossible sources - glowing flowers, luminescent mist, supernatural aura. Subtle lens effects - soft glow, dreamy halation on highlights. CINEMATOGRAPHY: Slightly Dutch angle (5-10 degrees) creating visual interest, f/1.8 super shallow DoF with creamy bokeh, THEIR FACE in razor-sharp focus while background dissolves into painterly soft focus with floating elements, subtle lens distortion creating dreamlike quality, fine film grain and subtle chromatic aberration on edges. Del Toro palette - deep teals (#008B8B), burgundy (#800020), rich greens (#9ACD32), old gold (#CFB53B), midnight blues (#191970), ash grays. Pan's Labyrinth meets Crimson Peak aesthetic - mysteriously beautiful, gothic romance, mysterious elegance, fantasy fairytale. Fine art photography meets fantasy cinema. The beautiful fantasy that mesmerizes.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate ultra-realistic vintage circus characters with theatrical cinema aesthetic, dramatic lighting, and premium photographic quality.${commonEnding}`;
      }
    }
    
    // MODO CLÁSICO
    if (mode === "clasico") {
      switch (style) {
        case "payaso-estrella":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: STAR CLOWN PERFORMER (Cirque du Soleil meets Ringling Bros. Golden Age). Photograph THIS PERSON dressed as a dazzling world-class clown performer in peak comedic moment.\n\nCOSTUME & STYLING: Premium theatrical clown costume - brilliant red tailcoat with oversized shiny gold buttons, electric blue satin vest with yellow polka dots, crisp white collar with enormous colorful bow tie (rainbow stripes or polka dots), baggy checkered pants (red and white), enormous colorful shoes with curled toes. Pristine theatrical quality. MAKEUP APPLICATION (VERY LIGHT - preserve THEIR natural face completely): Keep THEIR natural face mostly bare - only tiny cheerful accents: small red dot on nose tip, tiny colorful star or dot on ONE cheek. NO white face paint, NO painted smile, NO dramatic eye makeup. Their natural joyful expression creates the character. Keep THEIR skin tone, features, and natural beauty completely visible. HAIR: Style THEIR natural hair playfully (keeping THEIR EXACT hair color - just add volume or fun styling with THEIR own hair). NO wigs - their natural hair is perfect.\n\nJOYFUL ACTION & SPECTACLE: Captured mid-performance magic - juggling FIVE colorful balls frozen mid-air in perfect arc showing skill, or releasing hundreds of iridescent bubbles from oversized bubble wand (bubbles catching rainbow light), or pulling endless colorful scarves from hat with scarves flowing in all directions, or creating balloon sculpture mid-twist with partially formed balloon animals floating around. Giant rainbow umbrella spinning above them. Confetti explosion frozen mid-burst creating rainbow sparkle cloud. ACCESSORIES: Classic clown props in action - glossy juggling balls, rainbow umbrella, spring flowers popping from pocket, balloon animals in vibrant colors, bicycle horn, magic wand with colorful ribbons, oversized playing cards scattered. EXPRESSION: Capture THEIR pure explosive joy - huge genuine smile showing THEIR teeth, THEIR eyes wide and crinkled with real happiness, animated expression mid-laugh with head thrown back, eyebrows raised in comedic surprise. Body language: Open, inviting, energetic - arms spread wide in welcoming gesture or mid-comedic bow, one leg kicked up playfully, dynamic frozen motion. ENVIRONMENT: Classic big top circus in FULL SPECTACULAR GLORY - red and white striped tent ceiling with thousands of festive Edison bulbs, main circus ring with pristine red-bordered white floor, audience seating packed with families in soft focus showing blur of excited children pointing and parents laughing, candy vendors, cotton candy clouds visible. Multiple ring acts visible in background - trapeze artists mid-flight, tightrope walker, trained poodles jumping through hoops, other clowns in tiny car. Circus bunting and banners everywhere, vintage circus posters, balloon bouquets tied to seats, pennant flags. LIGHTING: Brilliant magical theatrical lighting - multiple powerful spotlights creating even, flattering illumination on THEIR FACE with no harsh shadows (beauty lighting), warm 3200K-4000K golden temperature, practical vintage string lights and marquee bulbs adding sparkle everywhere, slight lens flare for magic. Colorful theatrical gels creating rainbow light pools on floor - red, blue, yellow, green pools overlapping. Backlight creating rim glow on wig. CINEMATOGRAPHY: Straight-on engaging angle at slight low angle (heroic), vibrant saturated colors (Kodak Vision3 look), f/2.8 shallow DoF with creamy bokeh rendering background lights as glowing colorful orbs. Rich reds (#DC143C), vibrant blues (#00BFFF), sunshine yellows (#FFD700), pure whites, bubble rainbow refractions. Greatest Showman meets Pixar meets Vogue editorial aesthetic - glossy, joyful, premium, magical. Pure happiness captured.${commonEnding}`;
        
        case "maestro-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: GRAND RINGMASTER (Las Vegas Spectacular meets Greatest Showman). Photograph THIS PERSON dressed as a magnificent commanding circus master in peak presentation moment.\n\nCOSTUME & STYLING: Immaculate museum-quality ringmaster ensemble - rich crimson red tailcoat in luxurious velvet with intricate gold military braiding and epaulettes, matching red vest with antique brass buttons, crisp white dress shirt with wing collar, black silk bow tie perfectly tied, black dress pants with gold stripe, mirror-polished black leather riding boots with gold buckles. Pristine white gloves. Tall black top hat with wide red satin band and gold circus emblem catching light. Every detail gleaming perfection. ACCESSORIES: Ornate brass-topped baton held raised high in presentation gesture, elegant riding crop with leather grip and gold ferrule, vintage brass megaphone at hip, antique gold pocket watch chain glittering. GROOMING: Style THEIR HAIR neatly using THEIR EXACT natural hair color (just well-combed/brushed naturally), precisely groom any existing facial hair maintaining THEIR natural look. NO makeup - keep THEIR completely natural face. The elegant costume creates all the character needed.\n\nGRAND SPECTACLE & ACTION: Captured mid-grand-presentation gesture - arm sweeping dramatically toward the acts, baton raised commanding attention, other arm extended in welcoming flourish. MAGNIFICENT CIRCUS ACTS VISIBLE BEHIND THEM creating full spectacular environment: White Arabian horses with jeweled bridles parading in formation (one rearing majestically), decorated Indian elephant with golden howdah and ornate headpiece, acrobats mid-flip, aerial silk performers suspended, trained white doves in flight creating wings of birds, sparklers creating light trails, confetti cannons mid-burst. Full three-ring circus in orchestrated chaos. EXPRESSION: Capture THEIR confident magnetic showmanship - brilliant charismatic smile on THEIR face radiating authority and warmth, direct engaging eye contact from THEIR eyes making audience connection, raised eyebrows suggesting "Watch this!", commanding yet welcoming presence. Body position: Standing tall center stage with perfect posture, one arm extended toward camera inviting audience into the magic, mid-presentation bow with flourish, or triumphant arms-raised pose. ENVIRONMENT: Grand circus arena opening night in FULL SPECTACULAR GLORY - ornate proscenium arch with gold leaf and carved details, plush crimson velvet curtains with gold tassels pulled back revealing stage depth, polished hardwood stage reflecting lights, brass fixtures everywhere gleaming, MASSIVE chandelier with thousands of crystal drops and candles above casting glittering light. Full circus stage visible in depth - multiple acts performing: aerial apparatus with performers mid-flight, circus wagons rolling, performers in elaborate costumes, formal-dressed audience visible in ornate seating showing blurred motion of standing ovation, opera boxes with VIP guests. Opulent details everywhere - gilded railings, baroque painted ceiling murals of circus scenes, red carpet, decorative moldings, vintage circus posters in gold frames. Flower arrangements, champagne service visible. LIGHTING: Premium theatrical package creating magic hour - powerful key spotlight from front creating clean flattering face lighting on THEIR FACE (no harsh shadows), warm amber rim lights creating 24k golden glow around silhouette, soft fill eliminating any unflattering shadows, practical warm tungsten from vintage chandelier and fixtures, subtle gobo patterns projecting circus motifs (stars, top hats, elephants) on stage. Gold and amber palette, soft atmospheric haze making all light beams visible creating volumetric rays. Sparkle everywhere - crystal reflections, gold catching light, brass gleaming. CINEMATOGRAPHY: Eye-level to slight low angle emphasizing authority and grandeur, f/2.0 shallow DoF with subject in perfect focus and background elegantly blurred showing depth and spectacle. Maximum rich saturation. Deep crimsons (#8B0000), rich golds (#DAA520), warm browns (#8B4513), royal purple accents (#4B0082), ivory whites. Baz Luhrmann aesthetic (Moulin Rouge, Gatsby) - operatic, glamorous, over-top luxury. Met Gala meets Greatest Showman meets Barnum opening night - peak showmanship, Vogue editorial quality, red carpet glamour. The ringmaster commanding the greatest show on earth.${commonEnding}`;
        
        case "domador-legendario":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: LEGENDARY ANIMAL TAMER (Circus Golden Age meets National Geographic). Photograph THIS PERSON dressed as a noble commanding animal tamer in majestic harmony with magnificent beasts.\n\nCOSTUME & STYLING: Pristine safari-inspired circus costume - tailored khaki or cream jacket with gold military braiding on shoulders and sleeves, crisp white or cream shirt with stand collar, red silk bandana or cravat at neck, form-fitting jodhpur pants in tan or black, tall polished leather riding boots with gold buckles gleaming, wide leather belt with ornate brass circus-motif buckle. Short cape in deep blue or red with gold trim flowing over one shoulder. Immaculate suggesting adventure - lived-in elegant grandeur. ACCESSORIES: Braided leather whip with brass-capped handle held extended in commanding pose, leather gloves tucked in belt, brass whistle on chain catching light, vintage wooden chair (classic lion tamer prop) positioned nearby, ceremonial staff with brass circus emblem. APPEARANCE: Keep THEIR 100% natural facial features, exact skin tone, and bone structure. Style THEIR HAIR naturally (keeping THEIR EXACT natural color - just neatly combed with slight natural movement). NO makeup - maintain THEIR completely natural healthy complexion. Their natural confident presence creates the character.\n\nMAJESTIC BEASTS ESSENTIAL: Photograph them surrounded by FIVE MAGNIFICENT BIG CATS in regal harmony - TWO fully-maned male African lions sitting majestically on ornate gold-trimmed pedestals on either side (one lion with head raised showing mane catching light, other lion calm and watchful), TWO Bengal tigers positioned elegantly (one tiger sitting regally on lower pedestal showing stripes, one walking gracefully beside them), and ONE black panther in striking pose (prowling low or sitting alert) creating exotic power. ALL cats looking toward camera or tamer with intelligent eyes showing trust and respect - NO aggression, showing HARMONY and MUTUAL RESPECT between trainer and beasts. Cats should be photorealistic, detailed, adult specimens showing their natural majesty. EXPRESSION: Capture THEIR noble confidence mixed with warmth - THEIR direct commanding yet kindly gaze showing fearlessness and love for the craft, genuine smile on THEIR lips showing pride and affection for animals, proud upright posture radiating authority and compassion, one hand raised in calming/presenting gesture. POSE: Heroic classical stance - standing tall and confident in center of big cats, perhaps foot elevated on wooden platform for composition, arm extended holding whip raised in salute (not threat), other hand gesturing toward cats with pride and showmanship. Classical circus master composition. ENVIRONMENT: Grand circus arena during golden hour spectacular - magnificent big cats on ornate pedestals at multiple heights creating composition, golden ring floor polished to mirror shine reflecting sunset, elaborate pedestals and props with gold leaf and velvet cushions, rich red velvet draping on barriers, grand circus tent ceiling with warm sunset sunlight filtering creating god rays through haze, brass fixtures and cage bars gleaming like gold. Distant elements in soft focus: aerial apparatus with silks, gilt circus wagons with exotic animal motifs, lush tropical plants in decorative pots, palm fronds, vintage globe lights, distant audience in formal attire watching in awe. LIGHTING: Glorious golden hour cinema - warm 4000K-4500K key creating glowing healthy skin tones on THEIR FACE, golden rim creating luminous halo around hair and shoulders and catching on cat fur, soft bounced fill from tent fabric maintaining shadow detail without harshness, practical sunset sunlight streams creating volumetric beams through atmospheric haze illuminating dust particles. Warm romantic color temperature creating nostalgic timeless feel. Subtle natural lens flare from backlight. Cats lit to show their noble features and fur texture. CINEMATOGRAPHY: Heroic low angle (slightly below eye level) emphasizing nobility and power, f/2.2 shallow DoF with subject and foreground cats razor-sharp while background dissolves into creamy bokeh with circular light orbs. National Geographic portrait meets circus spectacular - rich warm tones, golden highlights, detailed shadows, editorial quality. Warm golds (#B8860B), safari tans (#D2B48C), rich browns (#654321), jungle greens (#4F7942), sunset oranges (#FF8C00), lion mane amber. Out of Africa meets Greatest Showman meets Life of Pi - adventure, nobility, exotic glamour, interspecies harmony. Timeless, heroic, majestic. National Geographic cover or classic Hollywood golden age poster. The legendary tamer and their magnificent family of beasts.${commonEnding}`;
        
        case "acrobata-profesional":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: PROFESSIONAL ACROBAT (Cirque du Soleil Principal meets Olympic Athlete). Photograph THIS PERSON as an elite aerial artist in peak performance showcasing superhuman grace.\n\nCOSTUME & STYLING: Designer performance couture - form-fitting unitard or two-piece in jewel tones with gradient effects (sapphire blue to royal purple, or champagne gold to rose gold), adorned with thousands of hand-sewn Swarovski crystals creating constellation patterns catching every light ray. Strategic cutouts and sheer mesh panels adding elegance, metallic or holographic fabric details creating shimmer. Athletic and haute couture fusion. Athletic tape wrapped artistically around wrists/ankles in matching metallic colors. For women: possible flowing chiffon skirt panel at hip creating movement. For men: fitted vest over toned physique. Costume fits like second skin, professionally tailored by costume designer, revealing THEIR natural athletic physique emphasized by costume cut and dramatic lighting. HAIR STYLING: Style THEIR HAIR secured naturally for aerial performance (keeping THEIR EXACT natural color and texture) - simple athletic bun or ponytail using THEIR own hair, NO added pieces, NO color additions. Natural and practical. MAKEUP: NO makeup - keep THEIR completely natural face and skin. Natural athleticism and lighting create all the beauty needed.\n\nAERIAL SPECTACLE: Suspended gracefully 25+ feet in air on premium aerial apparatus performing STUNNING TRICK - captured in one of these breathtaking poses: 1) Extended horizontal split while holding aerial silk with one hand creating perfect line, other arm reaching elegantly toward sky, or 2) Spectacular back arch suspended from polished chrome trapeze bar with arms flowing back creating bow shape, or 3) Graceful one-arm hold from circular aerial hoop (lyra) with legs creating beautiful S-curve, body creating living sculpture. OTHER AERIALISTS visible at different heights creating ensemble - two performers on distant silk doing synchronized moves, one on trapeze mid-flight reaching toward them, creating spectacular aerial ballet composition. Aerial silks and fabrics flowing with movement. Slight motion blur on flowing costume elements and distant performers while THEIR FACE perfectly sharp showing zen focus. Chalk powder cloud visible around hands backlit creating magic. PHYSICAL: THEIR peak athletic condition evident - defined muscles visible through costume, elegant lines, perfect posture, powerful grace, zero effort showing despite difficulty. EXPRESSION: Capture THEIR serene intensity - face showing concentrated artistry mixed with performance joy, THEIR eyes either closed in zen moment of perfect focus or gazing intensely toward camera/light with total confidence, subtle smile of flow state showing love of flight, peaceful warrior expression. ENVIRONMENT: World-class professional circus theater during performance (20-25 feet elevation clearly visible) - premium aerial apparatus creating geometric patterns (polished chrome trapeze bars, royal blue and crimson aerial silks creating vertical lines, circular aerial hoops at different heights, rope ladders, suspended platforms). Arena floor below with formal-dressed audience visible in soft focus - people looking up in awe, some with phones raised capturing magic, elegant theater seating in arc. Ceiling showing professional rigging systems, catwalks with lighting crew silhouettes, performers waiting in wings, other apparatus creating depth. Crystal chandeliers catching light, velvet curtains framing stage, decorative theatrical architecture. LIGHTING: World-class theatrical design creating fine art - multiple powerful spotlights creating soft beautiful key on performer from multiple angles eliminating harsh shadows on THEIR FACE, vibrant colored backlights (cyan, magenta, warm amber) creating separation and gorgeous rim lighting on muscles and fabric making crystals explode with light, floor lights creating upward fill adding drama, intelligent moving lights creating dynamic beams through atmospheric haze revealing floating chalk dust. Cirque du Soleil KÀ/O/Mystère show lighting quality. Every Swarovski crystal creating tiny lens flares. Color shifts in costume visible. CINEMATOGRAPHY: Dynamic elegant angle showing height and grace - looking up from below subject (flattering perspective emphasizing athleticism), f/2.0 shallow DoF with background dissolving into beautiful bokeh of colored lights and distant performers. Jewel tones rich and glowing: sapphire (#0F52BA), royal purple (#7851A9), rose gold (#B76E79), champagne (#F7E7CE), cyan highlights (#00FFFF), magenta accents. Annie Leibovitz circus portrait series aesthetic - dramatic, elegant, aspirational, fine art meets performance. Peak human performance meets high fashion. Olympic editorial meets Broadway poster meets Vogue fashion shoot. The artist defying gravity with grace.${commonEnding}`;
        
        case "artista-espectaculo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: SPECTACULAR PERFORMER (Broadway Opening Night meets Macy's Parade meets Super Bowl Halftime). Photograph THIS PERSON as the ultimate showman/showwoman in PEAK FINALE EXPLOSION MOMENT - the image that breaks the internet.\n\nCOSTUME & STYLING: Show-stopping SPECTACULAR performance costume - base form-fitting bodysuit in rich jewel tone (emerald green, royal purple, or sunset gold), COMPLETELY covered in hand-sewn sequins, rhinestones, Swarovski crystals, and bugle beads creating intricate patterns (sunbursts, stars, swirls, peacock eyes) - every inch catching light. Dramatic elements creating MAXIMUM impact: MASSIVE feather shoulder pieces (ostrich and peacock feathers creating 2-foot wingspan catching light and motion), flowing iridescent chiffon scarves attached to wrists creating rainbow trails when arms move, crystal-beaded fringe swaying from hips, short dramatic cape or train in iridescent fabric creating comet tail. SPECTACULAR headdress or crown adorned with feathers, jewels, fiber optic lights, crystals creating light fountain. EVERY surface engineered to catch and reflect light - rhinestones, mirrors, holographic sequins, LED accent lights. Fishnet tights with rhinestone patterns (if applicable), metallic or bedazzled performance boots/heels with platform. ACCESSORIES: SPECTACULAR props mid-action - 20-foot rainbow silk ribbons flowing from hands mid-twirl creating spiral in air, crystal juggling elements suspended mid-air catching light, magic wand with LED light-up star creating light trails, elaborate bouquets of flowers being tossed into air from adoring audience, champagne bottle mid-pop with spray frozen. APPEARANCE: Keep THEIR completely natural face - NO makeup changes, NO contouring, NO false lashes. Just THEIR natural beautiful face exactly as it is. The spectacular costume and lighting create all the glamour - their natural face stays untouched and recognizable. HAIR: Style THEIR HAIR using THEIR EXACT natural color and texture (just styled with volume/movement using THEIR own hair, decorated with flowers/jeweled clips as accessories). NO wigs, NO color changes - natural hair styled beautifully.\n\nEXPLOSIVE FINALE SPECTACLE: Captured at PEAK CELEBRATORY MOMENT - massive confetti cannon EXPLOSION frozen mid-burst creating rainbow cloud around them (metallic confetti, paper streamers, golden glitter, iridescent shapes ALL suspended mid-air catching light), pyrotechnic sparklers creating light trails and golden sparks, bubble machines creating soap bubble clouds reflecting rainbow, ribbon cannons launching colorful ribbons into air. EXPRESSION: Capture THEIR pure EXPLOSIVE performance ecstasy - HUGE genuine radiant smile on THEIR face showing pure joy and triumph, THEIR eyes wide open sparkling with excitement and glory, caught mid-laugh or exclamation of victory with mouth open in joy, head potentially thrown back in triumph. Body language creating MAXIMUM IMPACT: Arms spread WIDE embracing the universe, or both arms raised HIGH in victory V-shape, or mid-spectacular spin with costume and ribbons creating spiral of light and color, or blowing kiss to audience with hand to lips, or victorious fist pump. Dynamic kinetic energy frozen at PEAK - the exact moment photographers capture for magazine covers. ENVIRONMENT: Grand circus FINALE creating ABSOLUTE CHAOS OF JOY - MASSIVE circus stage during finale bow, confetti and streamers still falling creating rainbow curtain effect, golden sparkles and glitter suspended in light beams everywhere, full circus stage in celebration mode, background showing audience STANDING OVATION with motion blur on clapping hands, other performers in elaborate costumes cheering and celebrating behind them, ring floor covered in flower petals and confetti creating carpet of color. Magical finale pandemonium: Balloons rising toward ceiling creating floating orbs, ribbons flowing from ceiling, multiple confetti cannons, sparklers creating light shows, smoke machines creating atmosphere, other finale elements - white doves in flight, flower tosses, champagne spray. LIGHTING: ABSOLUTE THEATRICAL MAXIMUM - EVERY light in the house on creating magic hour times ten, multiple warm spotlights from every angle eliminating ALL shadows on THEIR FACE creating goddess/god lighting, colored intelligent moving lights creating rainbow effects and light sweeps, pyrotechnic sparklers creating practical light sources and trails, practical vintage string lights and MASSIVE marquee bulbs creating bokeh wonderland everywhere, powerful spotlight beams cutting through confetti-filled air creating volumetric light columns. Warm 3500K golden glow making skin absolutely luminous. Sparkle and glitter EVERYWHERE multiplying light. Follow spots creating multiple pools. Camera flash effect adding extra burst. CINEMATOGRAPHY: Heroic slight low angle capturing absolute triumph and glory, f/1.8 shallow DoF with INCREDIBLE bokeh rendering entire background into abstract colored light orbs and glowing shapes, floating confetti pieces in foreground slightly soft creating layered depth, motion blur on ribbons and flowing elements while THEIR FACE stays RAZOR sharp with perfect focus on eyes. MAXIMUM saturation - HDR look with glowing highlights and rich shadows. All jewel tones at MAXIMUM VIBRANCE: emerald greens (#50C878), royal purples (#7851A9), sunset golds (#FFD700), hot pinks (#FF69B4), electric blues (#00D4FF), rainbow spectrum everywhere. Super Bowl halftime promotional meets Beyoncé Formation World Tour meets Moulin Rouge finale meets Met Gala red carpet meets Times Square New Year. ABSOLUTE SPECTACLE creating sensory overload in best way. Vogue September cover, Times Square billboard takeover, Grammy Awards freeze-frame, viral internet-breaking moment shared millions of times. Maximum WOW factor - the image people screenshot and share saying "I NEED to see this show!" Pure celebration, pure joy, pure entertainment magic at absolute PEAK. VIP backstage access experience in single image. The finale moment everyone remembers forever.${commonEnding}`;
        
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
    setSelectedStyle(""); // Resetear estilo al cambiar de modo
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
      console.log(`📝 Prompt generado para transformación realista`);
      
      // Usar nano-banana-pro por defecto (1 imagen)
      const model = "google/nano-banana";
      console.log(`🤖 Usando modelo: ${model}`);
      
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        selectedStyle,
        "user-" + Date.now(),
        model
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
        text: "Por favor selecciona un modo (Terror o Clásico).",
      });
      return;
    }

    if (!selectedStyle) {
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
              </select>
              <span className="select-arrow">▼</span>
            </div>

            {/* Selector de ESTILO (condicional según el modo) */}
            {selectedMode && (
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
