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
    const baseInstructions = `PHOTOREALISTIC PORTRAIT SESSION - IDENTITY PRESERVATION CRITICAL: Photograph the exact person or people from this image dressed as circus characters. This is NOT creating new faces - you MUST keep their original face completely intact.

IDENTITY PRESERVATION (HIGHEST PRIORITY):
- Keep EXACT facial structure: jawline, cheekbones, chin shape, forehead
- Keep EXACT eye shape, eye color, eye spacing, eyebrow shape and position
- Keep EXACT nose shape and size
- Keep EXACT lip shape and mouth
- Keep EXACT skin tone, skin texture, freckles, moles, facial features
- Keep EXACT age appearance
- Keep EXACT hair color, hair texture, and hair type (only STYLE it for character, don't change color/texture)
- Keep EXACT gender expression and body type
- They must be INSTANTLY recognizable as themselves

You are photographing THIS SPECIFIC PERSON wearing a circus costume and professional makeup/styling - like a professional portrait photographer would. The costume, lighting, and environment change - THE FACE DOES NOT. Shot with cinema camera (RED Komodo 6K), 50mm portrait lens, f/2.8 shallow depth of field.`;
    
    const commonEnding = `\n\nREMEMBER: This is portrait photography of a REAL SPECIFIC PERSON in costume - not character creation. Their face, eyes, nose, mouth, skin tone, and hair color MUST remain EXACTLY as in the original photo. Only the costume, styling, lighting, and environment change to match the circus theme.\n\nLIGHTING: Three-point lighting setup with dramatic key light, soft fill, vibrant rim light. Volumetric fog/haze catching light rays. Cinematic color grading with rich saturated colors, deep blacks, glowing highlights.\n\nCOMPOSITION: Vertical 9:16 mobile format. Rule of thirds positioning, dynamic pose, eye contact with camera. Immersive themed background with atmospheric depth, practical lights, environmental details.\n\nQUALITY: 8K detail, magazine cover quality, Vogue/Vanity Fair editorial standard. Professional retouching maintaining natural skin texture, enhanced eye catchlights, subtle lens flare, film grain.\n\nMultiple people: Apply same costume/theme to each while preserving EVERY person's unique facial identity and position.\n\nAVOID: Changing face shape, eye color, skin tone, or hair color. No cartoon/anime style, no distorted anatomy, no extra limbs, no merged faces, no duplicate people, no text/watermarks, no plastic/overly smooth skin. Keep it photorealistic with their REAL face.`;
    
    // MODO TERROR
    if (mode === "terror") {
      switch (style) {
        case "payaso-maldito":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: EVIL CLOWN (Pennywise meets American Horror Story aesthetic). Photograph THIS PERSON dressed as a spine-chilling sinister clown performer.\n\nCOSTUME & STYLING: Distressed Victorian-era clown costume - weathered burgundy and midnight black silks, torn tulle ruffles, antique brass buttons, oxidized silver chains. Realistic fabric wear with frayed edges and authentic aging. MAKEUP APPLICATION (preserve their natural face shape): Professional horror theatrical makeup applied OVER their existing features - theatrical white base with intentional cracks, burgundy/purple contouring following THEIR natural bone structure, exaggerated painted smile extending from THEIR natural lip line, dark crimson painted nose accent, smudged dark shadow around THEIR eyes. HAIR STYLING: Style THEIR EXISTING HAIR into disheveled clown aesthetic - if they have dark hair keep it dark, if light keep it light, just add styling product for wild/dampened matted texture. Optional: small hair color accents or temporary spray on tips only (NOT full color change).\n\nEXPRESSION: Capture THEIR natural expression with unsettling charisma - slight head tilt, piercing gaze toward camera, subtle sinister smile. ENVIRONMENT: Abandoned 1920s circus tent - tattered red velvet curtains, vintage wooden props, dusty amber light shafts cutting through darkness, volumetric fog on weathered floor. LIGHTING: Single antique spotlight with warm tungsten creating dramatic shadows, purple and deep red gel side lights (film noir atmosphere). Vintage circus posters and old seats blurred in darkness. CINEMATOGRAPHY: f/2.0 shallow DoF keeping THEIR FACE razor sharp, slight low-angle adding presence, subtle vignette. Color palette: Desaturated reds (#8B0000), purples (#4B0082), sickly greens (#2F4F2F). Tim Burton meets Del Toro aesthetic.${commonEnding}`;
        
        case "dueno-circo-oscuro":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: DARK RINGMASTER (Victorian Gothic Opera aesthetic). Photograph THIS PERSON dressed as an elegant yet menacing circus master.\n\nCOSTUME & STYLING: Museum-quality Victorian ringmaster tailcoat - midnight black wool with deep crimson velvet lapels, intricate gold embroidery, matching waistcoat with antique brass buttons, crisp white high-collar shirt, black silk cravat with decorative skull pin. Tall top hat with burgundy band and raven feather. White leather gloves. ACCESSORIES: Ornate ebony cane with silver skull handle, or vintage leather bullwhip. GROOMING: Style THEIR HAIR immaculately (slicked back or elegantly styled keeping THEIR natural color), groom any existing facial hair precisely. Subtle dark eye makeup enhancing THEIR natural eye shape for intensity.\n\nEXPRESSION: Capture THEIR commanding presence - raised chin, penetrating gaze from THEIR eyes, hint of knowing smile on THEIR lips. Authoritative stance with hand extended holding cane/whip, other hand gesturing with showmanship. ENVIRONMENT: Gothic circus main stage at dusk - grand proscenium arch with carved details, heavy crimson velvet curtains with gold tassels, antique gas lamps, theatrical haze on polished wooden stage. Blurred audience seating, vintage circus wagons, hanging aerial silks in darkness. LIGHTING: Dramatic theatrical - powerful key from above creating noir shadows on THEIR FACE (following their natural bone structure), crimson gel backlights creating glowing rim, purple accent floor lights creating upward shadows, warm practical gas lamp light. Dust particles in light beams. CINEMATOGRAPHY: Slightly low angle emphasizing authority, f/2.2 shallow DoF, rich blacks with glowing highlights. Bleach bypass color grade with pushed reds/golds, crushed blacks. Crimson Peak meets Phantom aesthetic.${commonEnding}`;
        
        case "domador-salvaje":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: WILD BEAST TAMER (Mad Max meets 1930s Circus Danger Acts). Photograph THIS PERSON dressed as a battle-hardened fearless animal tamer.\n\nCOSTUME & STYLING: Distressed genuine leather ensemble - worn brown leather vest with visible scratches/repairs, weathered cotton shirt with rolled sleeves, thick leather belt with brass buckle, dark fitted pants in tall leather boots with metal buckles. Protective leather arm guards with metal studs and brass rivets showing wear. Heavy leather gloves. ACCESSORIES: Braided leather whip held confidently or coiled at belt, heavy brass/steel chains draped over shoulder, leather bandolier. APPEARANCE: Keep THEIR natural facial features and skin tone. Style THEIR HAIR to look wind-swept and rugged (using THEIR natural hair color/texture). Subtle dirt/dust makeup effects on skin for realism - but maintaining THEIR skin tone and texture.\n\nEXPRESSION: Capture THEIR fierce, fearless demeanor - intense eye contact from THEIR eyes, determined expression on THEIR face, powerful stance. Captured mid-motion or static power pose. ENVIRONMENT: Dark 1930s circus cage/arena - massive iron cage with thick bars catching rim light, heavy chains from ceiling, scattered straw on worn wooden floor, claw marks on posts, dramatic shadows. Silhouettes of big cats safely distant in shadows, vintage apparatus barely visible. LIGHTING: Gritty high-contrast film noir - harsh side key creating dramatic shadows following THEIR cheekbone structure, minimal fill for dangerous mood, powerful orange/amber rim separating from darkness, smoke/dust catching light. Single practical torch/lantern. Color palette: Desaturated browns, deep oranges, charcoal blacks, splashes of deep red. CINEMATOGRAPHY: Eye-level dynamic angle, f/2.0 shallow DoF, slight motion blur if whip moving, gritty film grain. There Will Be Blood meets Peaky Blinders aesthetic.${commonEnding}`;
        
        case "acrobata-extremo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: EXTREME AERIAL ACROBAT (Cirque du Soleil Dark Edition meets Blade Runner). Photograph THIS PERSON as a gravity-defying performer in dramatic aerial pose.\n\nCOSTUME & STYLING: Form-fitting performance suit in technical fabrics - midnight black athletic material with burgundy and electric blue geometric patterns, strategic mesh panels, industrial silver zippers and hardware, leather straps crisscrossing torso and thighs, metallic studs along seams. Gothic athletic aesthetic. Wrapped hands/wrists with black athletic tape, bare feet or minimal aerial shoes. THEIR natural athletic physique emphasized by costume fit and lighting. HAIR STYLING: Style THEIR HAIR secured back for aerial performance (keeping THEIR natural color) - pulled back smoothly or in performance-ready style.\n\nBODY POSITION: Suspended on aerial silks/rope/trapeze bar in dramatic pose showing strength and flexibility (one-arm hang, split, or power hold). THEIR hair flowing with movement. Slight motion blur on fabric/moving elements while THEIR FACE stays sharp. EXPRESSION: Capture THEIR intense focus mixed with performance energy - THEIR eyes locked on distance or camera, face showing concentration and thrill of height. ENVIRONMENT: High above dark circus arena (30+ feet elevation visible), dramatic vertical perspective looking slightly upward, arena floor far below with tiny audience silhouettes. Aerial equipment (trapeze, ropes, deep red/black silks) catching dramatic lighting. Industrial circus ceiling with exposed beams, rigging, catwalks. LIGHTING: Theatrical aerial lighting - powerful spotlights from below creating dramatic upward illumination, cyan and magenta backlig hts creating electric glow on fabric and body edges, volumetric light beams through darkness revealing dust/chalk powder. Rim lighting outlining muscles and fabric. CINEMATOGRAPHY: Dynamic perspective with vertigo sense, shallow DoF with background dissolving, f/2.2 aperture creating bokeh on distant lights. Color grade: Cyberpunk-circus - deep blues (#000080), electric cyans (#00FFFF), vibrant magentas (#FF00FF), rich blacks. Blade Runner 2049 aesthetic.${commonEnding}`;
        
        case "pesadilla-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: NIGHTMARE CIRCUS ENTITY (Pan's Labyrinth meets Silent Hill). Photograph THIS PERSON as an otherworldly, hauntingly beautiful circus being.\n\nCOSTUME & STYLING: Surreal fusion of vintage circus and dark fantasy - aged burgundy and black performance costume with unexpected elements: Victorian lace with leather, antique keys on chains, small tarnished mirrors reflecting light, aged circus canvas strips, dried flowers (deep red roses, black dahlias) woven in. Elegant yet unsettling aesthetic. MAKEUP & EFFECTS (preserve THEIR face): Professional fantasy theatrical makeup applied OVER THEIR features - very pale foundation maintaining THEIR bone structure, burgundy/purple contouring following THEIR natural facial contours, metallic gold or silver accents on THEIR cheekbones/temples catching light, dark lips enhancing THEIR natural lip shape, dark smokey effect around THEIR eyes with optional unusual contact lenses (keeping THEIR eye shape). Optional: Small subtle fantasy prosthetic accents (tiny horns/pointed ears) blended seamlessly - but keeping THEIR FACE recognizable. HAIR: Style THEIR EXISTING HAIR with fantasy circus aesthetic (maintaining THEIR color, adding styling/small decorative elements).\n\nACCESSORIES: Hauntingly beautiful props - ornate cracked Venetian mask (half-face), transformed vintage circus props (rusted clubs, music box, aged playing cards) floating around. EXPRESSION: Capture THEIR enigmatic otherworldly presence - slight head tilt, THEIR direct unsettling gaze, expression between serene and sinister. ENVIRONMENT: Surreal nightmare circus realm - distorted perspective with converging lines, impossible Escher-inspired architecture, vintage circus elements decaying beautifully (gilt mirrors, faded posters, broken carousel horses), thick volumetric fog, practical candles/lanterns creating warm light islands in cold darkness. Blurred surreal floating elements - circus props, fabrics, petals creating dreamlike atmosphere. LIGHTING: Surreal painterly setup - key light with unusual color (sickly green #90EE90, deep purple #4B0082, or eerie cyan), multiple colored rim lights (purple, gold, green), practical candlelight contrast, haze catching colored beams creating magical realism. Light from impossible sources. CINEMATOGRAPHY: Slightly Dutch angle, f/1.8 shallow DoF with creamy bokeh, subtle lens distortion, film grain and subtle color aberration. Del Toro palette - deep teals, burgundy, poisonous greens, old gold, midnight blues. Pan's Labyrinth aesthetic - hauntingly beautiful, unsettling elegance.${commonEnding}`;
        
        default:
          return `${baseInstructions}\n\nCreate ultra-realistic dark circus characters with horror cinema aesthetic, dramatic theatrical lighting, and premium photographic quality.${commonEnding}`;
      }
    }
    
    // MODO CLÁSICO
    if (mode === "clasico") {
      switch (style) {
        case "payaso-estrella":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: STAR CLOWN PERFORMER (Cirque du Soleil meets Ringling Bros. Golden Age). Photograph THIS PERSON dressed as a dazzling world-class clown performer.\n\nCOSTUME & STYLING: Premium theatrical clown costume - brilliant red tailcoat with oversized shiny gold buttons, electric blue satin vest with yellow polka dots, crisp white collar with enormous colorful bow tie (rainbow stripes or polka dots), baggy checkered pants (red and white), enormous colorful shoes with curled toes. Pristine theatrical quality. MAKEUP APPLICATION (preserve THEIR natural face): Professional Ringling Bros. style clown makeup applied WITH PRECISION OVER THEIR FEATURES - smooth theatrical white base, bright red round nose accent on THEIR nose, painted smile design extending artistically from THEIR natural smile (joyful, proportional, not scary), colorful painted accents around THEIR eyes (blue, yellow keeping THEIR eye shape), optional painted teardrop or star on THEIR cheek. WIG: Classic theatrical clown wig over THEIR hair in rainbow, bright blue, or fire-engine red - voluminous and perfectly styled (keeps THEIR head shape visible).\n\nACCESSORIES: Classic clown props - colorful juggling balls with glossy surfaces, rainbow umbrella, bicycle horn, spring flowers, balloon animals mid-creation. EXPRESSION: Capture THEIR pure joy - huge genuine smile showing THEIR teeth, THEIR eyes crinkled with real happiness, animated expression mid-laugh. Body language: Open, inviting, energetic - arms spread wide welcoming or mid-comedic gesture. ENVIRONMENT: Classic big top circus in full glory - red and white striped tent ceiling with festive lights, main circus ring with pristine red-bordered white floor, audience seating in soft focus with blurred spectators. Multiple ring lights creating star pattern, circus bunting and banners, glimpse of other acts (trapeze, tightrope). LIGHTING: Brilliant theatrical lighting - multiple spotlights creating even, flattering illumination on THEIR FACE, no harsh shadows (beauty lighting), warm 3200K-4000K temperature, practical string lights and marquee bulbs adding sparkle, slight lens flare for magic. Colorful gels creating rainbow light pools. CINEMATOGRAPHY: Straight-on engaging angle at slight low angle (heroic), vibrant saturated colors (Kodak Vision3 look), f/2.8 shallow DoF with creamy bokeh rendering background lights as glowing orbs. Rich reds (#DC143C), vibrant blues (#00BFFF), sunshine yellows (#FFD700), pure whites. Greatest Showman meets Vogue aesthetic - glossy, joyful, premium.${commonEnding}`;
        
        case "maestro-circo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: GRAND RINGMASTER (Las Vegas Spectacular meets Greatest Showman). Photograph THIS PERSON dressed as a magnificent commanding circus master.\n\nCOSTUME & STYLING: Immaculate museum-quality ringmaster ensemble - rich crimson red tailcoat in luxurious velvet with intricate gold military braiding and epaulettes, matching red vest with antique brass buttons, crisp white dress shirt with wing collar, black silk bow tie perfectly tied, black dress pants with gold stripe, mirror-polished black leather riding boots with gold buckles. Pristine white gloves. Tall black top hat with wide red satin band and gold circus emblem. Every detail gleaming. ACCESSORIES: Ornate brass-topped baton or elegant riding crop with leather grip and gold ferrule, vintage brass megaphone, antique gold pocket watch chain visible. GROOMING: Style THEIR HAIR immaculately - perfectly coiffed or slicked back (keeping THEIR natural color with shine product), precisely groom any existing facial hair. Subtle stage makeup enhancing THEIR natural features under lights.\n\nEXPRESSION: Capture THEIR confident showmanship - charismatic smile on THEIR face, direct engaging eye contact from THEIR eyes suggesting audience connection, raised hand gesturing welcomingly as if introducing the show. Commanding yet welcoming. Body position: Standing tall with perfect posture, arm extended toward camera inviting audience in, or mid-bow with flourish. ENVIRONMENT: Grand circus arena in opening night glory - ornate proscenium arch with gold leaf, plush crimson velvet curtains with gold tassels pulled back dramatically, polished wooden stage, brass fixtures, chandeliers with hundreds of lights above. Full circus stage in soft focus - aerial apparatus, circus wagons, other performers, audience in formal attire. Opulent details - gold railings, painted murals, decorative moldings. LIGHTING: Premium theatrical package - powerful key spotlight from front creating clean flattering face lighting on THEIR FACE, warm amber rim lights creating golden glow, soft fill eliminating harsh shadows, practical tungsten from vintage fixtures, subtle gobo patterns projecting circus motifs. Gold and amber palette, soft haze making beams visible. CINEMATOGRAPHY: Eye-level to slight low angle emphasizing authority, f/2.0 shallow DoF with subject sharp and background elegantly blurred, rich saturation. Deep crimsons (#8B0000), rich golds (#DAA520), warm browns (#8B4513), royal purple accents. Baz Luhrmann aesthetic (Moulin Rouge, Gatsby) - operatic, glamorous. Met Gala meets Greatest Showman - peak showmanship, Vogue editorial quality.${commonEnding}`;
        
        case "domador-legendario":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: LEGENDARY ANIMAL TAMER (Circus Golden Age meets National Geographic). Photograph THIS PERSON dressed as a noble commanding animal tamer.\n\nCOSTUME & STYLING: Pristine safari-inspired circus costume - tailored khaki or cream jacket with gold military braiding on shoulders and sleeves, crisp white or cream shirt with stand collar, red silk bandana or cravat at neck, form-fitting jodhpur pants in tan or black, tall polished leather riding boots with gold buckles, wide leather belt with ornate brass circus-motif buckle. Optional: Short cape in deep blue or red with gold trim over one shoulder. Immaculate but suggesting adventure - lived-in elegance. ACCESSORIES: Braided leather whip with brass-capped handle (coiled elegantly or extended), leather gloves tucked in belt, brass whistle on chain, vintage wooden chair (classic lion tamer prop) nearby, ceremonial staff with brass circus emblem. APPEARANCE: Keep THEIR natural facial features, skin tone, and bone structure. Style THEIR HAIR confidently (keeping THEIR natural color, adding subtle shine product). Maintain THEIR healthy complexion. Subtle stage makeup defining THEIR features under lights.\n\nEXPRESSION: Capture THEIR noble confidence mixed with warmth - THEIR direct commanding gaze showing fearlessness, hint of smile on THEIR lips showing love for craft, proud upright posture, hand raised in calming gesture or triumph. POSE: Heroic stance - standing tall, perhaps foot elevated on wooden platform, arm extended holding whip artistically, other hand on hip or gesturing. Classical composition. ENVIRONMENT: Grand circus arena during golden hour - magnificent big cats visible in background (tigers or lions resting calmly on pedestals, safe distance, showing harmony), golden ring floor polished to shine, ornate pedestals and props with gold leaf, red velvet draping, tent ceiling with warm sunlight filtering creating god rays, brass fixtures gleaming. Soft focus circus magic - distant aerial apparatus, gilt circus wagons, tropical plants in pots. LIGHTING: Golden hour cinema - warm 4000K key creating glowing healthy skin tones on THEIR FACE, golden rim creating halo around hair and shoulders, soft bounced fill maintaining shadow detail, practical sunlight streams creating volumetric beams through haze. Warm color temperature creating nostalgic romantic feel. Subtle lens flare from backlight. CINEMATOGRAPHY: Heroic low angle (slightly below eye level) emphasizing nobility, f/2.2 shallow DoF with subject razor-sharp and background dissolving into creamy bokeh with circular light orbs. National Geographic portrait style - rich warm tones, golden highlights, detailed shadows. Warm golds (#B8860B), safari tans (#D2B48C), rich browns (#654321), jungle greens (#4F7942), sunset oranges (#FF8C00). Out of Africa meets Greatest Showman - adventure, nobility, exotic glamour. Timeless, heroic. National Geographic cover or classic Hollywood poster quality.${commonEnding}`;
        
        case "acrobata-profesional":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: PROFESSIONAL ACROBAT (Cirque du Soleil Principal meets Olympic Athlete). Photograph THIS PERSON as an elite aerial artist in peak performance.\n\nCOSTUME & STYLING: Designer performance couture - form-fitting unitard or two-piece in jewel tones with gradient effects (sapphire blue to royal purple, or champagne gold to rose gold), adorned with thousands of Swarovski crystals creating constellation patterns catching light. Strategic cutouts and sheer mesh panels adding elegance, metallic or holographic fabric details. Athletic and haute couture fusion. Athletic tape wrapped artistically around wrists/ankles in matching colors. For women: possible flowing chiffon skirt panel at hip. For men: fitted vest over toned physique. Costume fits like second skin, professionally tailored, revealing THEIR natural athletic physique emphasized by costume and lighting. HAIR STYLING: Style THEIR HAIR secured for aerial performance (keeping THEIR natural color) - slicked back bun with crystals, flowing ponytail, or precisely styled short cut. MAKEUP: Minimal strategic stage makeup highlighting THEIR natural bone structure, subtle shimmer on THEIR shoulders/collarbones catching light.\n\nPHYSICAL: THEIR peak athletic condition evident - defined muscles, elegant lines, perfect posture, powerful grace. POSE: Suspended gracefully on aerial apparatus in challenging position showing strength and flexibility (extended split, back arch, one-arm hold), one hand reaching toward rigging, legs creating beautiful lines. Slight motion blur on fabric/hair suggesting movement, THEIR FACE perfectly sharp showing focus. EXPRESSION: Capture THEIR serene intensity - face showing concentrated artistry mixed with performance energy, THEIR eyes closed in zen moment or gazing toward light/camera with intensity, subtle smile of flow state. ENVIRONMENT: Professional circus theater at performance (20+ feet elevation visible), premium aerial apparatus (polished chrome trapeze, royal blue/crimson aerial silks, circular aerial hoop), arena below with soft focus formal-attire audience or ornate empty seating. Ceiling showing professional rigging, catwalks, performers waiting in shadows. Other apparatus in distance, crystal chandeliers, velvet curtains creating depth. LIGHTING: World-class theatrical design - multiple spotlights creating soft key on performer eliminating harsh shadows on THEIR FACE, vibrant colored backlights (cyan, magenta, amber) creating separation and rim lighting on muscles and fabric, floor lights creating upward fill, moving lights creating dynamic beams through haze revealing chalk dust. Cirque du Soleil KÀ/O show lighting quality. Sparkle from crystals creating natural lens flares. CINEMATOGRAPHY: Dynamic angle showing height and grace - slightly below subject (flattering perspective), f/2.0 shallow DoF with background dissolving into beautiful bokeh of colored lights. Jewel tones rich and glowing: sapphire (#0F52BA), royal purple (#7851A9), rose gold (#B76E79), champagne (#F7E7CE), cyan highlights (#00FFFF). Annie Leibovitz circus portrait aesthetic - dramatic, elegant, aspirational. Peak human performance. Olympic editorial meets Broadway poster quality.${commonEnding}`;
        
        case "artista-espectaculo":
          return `${baseInstructions}\n\nCIRCUS CHARACTER: SPECTACULAR PERFORMER (Broadway Opening Night meets Macy's Parade). Photograph THIS PERSON as the ultimate showman/showwoman in peak finale moment.\n\nCOSTUME & STYLING: Show-stopping performance costume - base form-fitting bodysuit in rich jewel tone (emerald green, royal purple, or sunset gold), completely covered in hand-sewn sequins, rhinestones, crystals, and bugle beads creating intricate patterns (sunbursts, stars, swirls). Dramatic elements: Massive feather shoulder pieces (ostrich and peacock feathers creating 2-foot wingspan), flowing chiffon scarves attached to wrists, crystal-beaded fringe swaying from hips, possible short cape or train in iridescent fabric. Headdress or crown adorned with feathers, jewels, lights. Every surface catches light. Fishnet tights with rhinestone patterns (if applicable), metallic or bedazzled performance boots/heels. ACCESSORIES: Spectacular props - rainbow silk ribbons flowing from hands mid-twirl, crystal juggling elements suspended mid-air, magic wand with light-up star creating trails, or elaborate floral bouquets from adoring audience. APPEARANCE: Performance glam makeup applied OVER THEIR FEATURES - dramatic eye makeup enhancing THEIR eye shape with rhinestones, false lashes, perfect contouring following THEIR bone structure, bright lips on THEIR natural lip shape, body shimmer on visible skin catching light. HAIR: Style THEIR HAIR with voluminous perfection (keeping THEIR color, added volume/accessories - flowers, feathers, glitter spray catching light).\n\nEXPRESSION: Capture THEIR pure performance ecstasy - massive genuine smile on THEIR face radiating joy, THEIR eyes wide and sparkling with excitement, caught mid-laugh or exclamation of delight. Body language: Arms spread wide embracing world, or arm raised triumphantly, or mid-spin with costume flowing, or blowing kiss to audience. Dynamic kinetic energy frozen. Peak moment everyone photographs. ENVIRONMENT: Grand circus finale - confetti and streamers falling frozen mid-air, golden sparkles and glitter in light beams, full circus stage in celebration, background showing soft focus audience standing clapping (motion blur on hands), other performers cheering, ring floor covered in flower petals. Magical finale chaos. Balloons rising, ribbons flowing, motion creating energy. LIGHTING: Full theatrical finale - EVERY light on creating magic hour, warm spotlights from multiple angles eliminating shadows on THEIR FACE, colored moving lights creating rainbow effects, pyrotechnic sparklers creating light trails (safe effects), practical string lights and marquee bulbs creating bokeh wonderland, spotlight beams through confetti-filled air. Warm 3500K golden glow making skin luminous. Everything sparkles. CINEMATOGRAPHY: Heroic slight low angle capturing triumph, f/1.8 shallow DoF with incredible bokeh rendering background into colored light orbs, confetti pieces in foreground slightly soft creating depth, motion blur on flowing elements while THEIR FACE stays sharp. Maximum saturation - HDR look with glowing highlights. All jewel tones at maximum: emerald greens (#50C878), royal purples (#7851A9), sunset golds (#FFD700), hot pinks (#FF69B4), electric blues (#00D4FF). Super Bowl halftime promotional meets Beyoncé tour meets Moulin Rouge finale. Absolute SPECTACLE. Vogue cover, Times Square billboard, Grammy freeze-frame, viral internet-breaking moment. Maximum wow factor - the image people save and share saying 'I need to see this show!' Pure celebration, joy, entertainment magic at peak. VIP experience in single image.${commonEnding}`;
        
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
      
      const result = await aiImageService.generateImageWithFormData(
        capturedImage,
        prompt,
        '',
        "user-" + Date.now()
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
                display: "none",
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
