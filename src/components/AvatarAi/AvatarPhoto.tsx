import React, { useState, useRef } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";
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
  const [referenceImages, setReferenceImages] = useState<Blob[]>([]); // Imágenes de referencia
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]); // URLs para mostrar previews
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<string>(""); // Estado para el estilo de IA seleccionado
  
  // REALISTIC = "realistic",
  // ARTISTIC = "artistic",
  // CARTOON = "cartoon",
  // PROFESSIONAL = "professional",
  // VINTAGE = "vintage",
  const webcamRef = useRef<WebcamRef | null>(null);

  // Función para generar el prompt basado en el estilo de IA seleccionado
  const getPromptByStyle = (style: string): string => {
    const baseInstructions = `Use the first attached image as the base photo containing the real person or group of people. This image must remain the original foundation of the final result. Preserve their facial features, expressions, and recognizable characteristics. IMPORTANT: Preserve the original background and environment from the base photo - keep the same location, setting, and surroundings.`;
    
    const referenceInstructions = referenceImages.length > 0 
      ? `\n\nUse all other attached images (second, third, etc.) as references for characters that will be added into the scene. Insert those characters naturally beside the people from the base photo, interacting warmly (like placing an arm around shoulders or giving a friendly side hug). Make sure the characters do not cover the faces of the real people.`
      : '';
    
    const commonEnding = `\n\nCarefully match lighting, perspective, and scale. Avoid distortions, extra limbs, duplicated faces, text, logos, or watermarks.\n\nThe final image should be vertical (aspect ratio 9:16), optimized for mobile viewing and social media stories.`;
    
    switch (style) {
      case "disney-pixar":
        return `${baseInstructions}\n\nTransform the people in the photo into Disney Pixar 3D animation style: vibrant colors, expressive big eyes, smooth skin texture, exaggerated but appealing facial features, characteristic Pixar lighting with soft shadows and warm tones. The characters should look like they belong in a Pixar movie - friendly, appealing, and full of personality. Apply the same Disney Pixar 3D animation aesthetic to the background and environment from the original photo, converting it to match the Pixar movie style while keeping the same location and scene recognizable.${referenceInstructions}${commonEnding}`;
      
      case "funkos":
        return `${baseInstructions}\n\nTransform the people into Funko Pop style: oversized square head, small body proportions (head should be 3x larger than body), big round black eyes, simplified facial features, smooth matte finish, characteristic Funko Pop aesthetic with clean lines and bold colors. Maintain the recognizable Funko collector figure look. Keep the original background and setting from the base photo, stylizing it slightly to match the Funko Pop aesthetic with simplified clean shapes and bold colors while preserving the recognizable location.${referenceInstructions}${commonEnding}`;
      
      case "anime":
        return `${baseInstructions}\n\nTransform the people into anime/manga style: large expressive eyes with detailed highlights, smooth skin with subtle blush, detailed hair with dynamic flow and shine, vibrant colors, characteristic anime facial proportions and expressions. Style should resemble high-quality modern anime with clean linework and cel-shaded coloring. Apply the anime aesthetic to the background from the original photo as well, converting it to anime style with cel-shaded coloring and clean linework while maintaining the same location and environment.${referenceInstructions}${commonEnding}`;
      
      case "3d-caricature":
        return `${baseInstructions}\n\nTransform the people into 3D caricature style: exaggerated but recognizable features, oversized expressive eyes, slightly enlarged head, smooth detailed skin, professional 3D rendering with realistic lighting and textures. Keep facial identity clear while adding artistic exaggeration. High-quality render with depth and dimension. Keep the original background and environment from the base photo, applying subtle 3D stylization to match the caricature aesthetic while preserving the location.${referenceInstructions}${commonEnding}`;
      
      case "promotional-cinematic":
        return `${baseInstructions}${referenceInstructions}\n\nKeep the original background and environment from the base photo. Enhance it with vibrant promotional cinematic style: add warm modern lighting effects, colorful atmospheric enhancements, and professional color grading to create a lively energetic atmosphere. The person should look happy and enthusiastic. Apply vibrant cinematic lighting with dramatic warm tones, professional promotional poster aesthetic, ultra high resolution, colorful and eye-catching composition with rich saturated colors, dynamic lighting, and polished poster-quality finish. Maintain the original location but enhance it to look more vibrant and inviting.\n\nThe final image should be vertical (aspect ratio 9:16), optimized for mobile viewing and social media stories.`;
      
      case "realistic-photo":
        return `${baseInstructions}${referenceInstructions}\n\nMaintain a completely realistic photographic style. Do NOT apply any artistic transformation, cartoon effects, or stylization. Keep the people looking exactly as they appear in real life - natural skin texture, realistic proportions, authentic facial features, and natural expressions. IMPORTANT: Preserve the original background and environment from the base photo exactly as it appears. Apply only subtle professional photo enhancements: balanced exposure, natural color correction, soft lighting adjustments, and clean sharpening. The result should look like a high-quality professional photograph taken with a professional camera, maintaining complete photorealism. Preserve natural skin tones, realistic hair texture, authentic clothing details, true-to-life appearance, and the original setting/location.${commonEnding}`;
      
      default:
        return `${baseInstructions}${referenceInstructions}\n\nApply professional photography style with balanced exposure, natural skin tones, and cinematic color grading.${commonEnding}`;
    }
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

  // Manejar selección de imágenes de referencia
  const handleReferenceImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validar que no exceda 5 imágenes de referencia
    if (fileArray.length > 5) {
      Swal.fire({
        icon: "warning",
        title: "Máximo 5 imágenes",
        text: "Puedes seleccionar hasta 5 imágenes de referencia.",
      });
      return;
    }

    // Convertir archivos a Blobs y crear URLs para preview
    const blobs: Blob[] = [];
    const urls: string[] = [];

    fileArray.forEach((file) => {
      blobs.push(file);
      urls.push(URL.createObjectURL(file));
    });

    setReferenceImages(blobs);
    setReferenceImageUrls(urls);

    console.log(`✅ ${blobs.length} imágenes de referencia seleccionadas`);
  };

  // Eliminar una imagen de referencia
  const handleRemoveReferenceImage = (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    const newUrls = referenceImageUrls.filter((_, i) => i !== index);
    
    setReferenceImages(newImages);
    setReferenceImageUrls(newUrls);
  };

  // Procesa la imagen usando el nuevo servicio de IA con múltiples imágenes
  const handleProcessImage = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      console.log("🚀 Procesando imagen con IA...");
      console.log(`📸 Foto de usuario + ${referenceImages.length} imágenes de referencia`);
      
      // Convertir la imagen original (capturedImage) a data URL para pasarla al parent
      const reader = new FileReader();
      const originalImageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(capturedImage);
      });
      
      // Cambiar INMEDIATAMENTE a la pantalla de formulario sin esperar
      onProcess(email); // Pasa al formulario mientras la imagen se procesa en background
      
      // Procesar la imagen en background con prompt basado en estilo
      const prompt = getPromptByStyle(selectedStyle);
      console.log(`📝 Usando estilo: ${selectedStyle || 'default'}`);
      
      let result;
      
      if (referenceImages.length > 0) {
        // Usar el nuevo método para múltiples imágenes
        result = await aiImageService.generateImageWithMultipleImages(
          capturedImage,
          referenceImages,
          prompt,
          '',
          "user-" + Date.now()
        );
      } else {
        // Si no hay referencias, usar el método original
        result = await aiImageService.generateImageWithFormData(
          capturedImage,
          prompt,
          '',
          "user-" + Date.now()
        );
      }

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
    const testImageUrl = "https://storage.googleapis.com/imagen-ia-845a3.firebasestorage.app/generated-images/business_1761234505975.png";
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
    // También limpiar las imágenes de referencia
    setReferenceImages([]);
    setReferenceImageUrls([]);
  };

  // Validación del formulario y envío de la imagen
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStyle) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Por favor selecciona un estilo de IA.",
      });
      return;
    }

    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Primero toma una foto.",
      });
      return;
    }

    // Las imágenes de referencia ahora son OPCIONALES
    // No validamos referenceImages.length

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
            {/* Selector de estilo IA */}
            <div className="select-container">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="input"
                required
              >
                <option value="" disabled>
                  Selecciona Estilo IA
                </option>
                <option value="realistic-photo">📷 Fotográfico Real</option>
                <option value="disney-pixar">🎬 Disney Pixar</option>
                <option value="funkos">🎭 Funkos</option>
                <option value="anime">🎨 Anime/Manga</option>
                <option value="3d-caricature">😄 Caricatura 3D</option>
                <option value="promotional-cinematic">📸 Promocional Cinemático</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>

            <button
              type="button"
              className="button button-camera"
              onClick={capturedImageUrl ? handleResetCapture : handleCapture}
              disabled={isProcessing}
            >
              <div
                style={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {capturedImageUrl ? "Tomar otra" : "Tomar foto"}
              </div>
            </button>
            
            {/* Selector de imágenes de referencia */}
            {capturedImageUrl && (
              <div className="reference-images-section">
                <label className="reference-label">
                  🌟 Selecciona personajes/famosos (hasta 5) - Opcional:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReferenceImagesChange}
                  className="file-input"
                  id="reference-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="reference-input" className="button button-file">
                  📷 Agregar imágenes
                </label>
                
                {/* Mostrar previews de las imágenes seleccionadas */}
                {referenceImageUrls.length > 0 && (
                  <div className="reference-previews">
                    {referenceImageUrls.map((url, index) => (
                      <div key={index} className="reference-preview">
                        <img src={url} alt={`Referencia ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemoveReferenceImage(index)}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {referenceImageUrls.length > 0 && (
                  <p className="reference-count">
                    {referenceImageUrls.length} imagen(es) de referencia seleccionada(s)
                  </p>
                )}
              </div>
            )}
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
                display: 'none'
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
