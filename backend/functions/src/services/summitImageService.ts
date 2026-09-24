import sharp from "sharp";
import {
  SUMMIT_ASPECT_RATIO,
  SUMMIT_FILTERS,
  SUMMIT_STORAGE,
  SummitFilterId,
  SummitProvider,
} from "../config/summit";
import { base64ToBuffer, generateRequestId, retryWithBackoff } from "../utils";
import { uploadToStorage } from "../utils/storage";
import { getStyleReferenceUrl } from "../utils/summitAssets";
import { composeSummitFrame } from "../utils/summitFrame";
import { saveSummitParticipante } from "../utils/summitFirestore";
import { obtenerProveedor } from "./proveedores";

export interface SummitGenerationRequest {
  /** Foto del visitante en base64 (data URL). */
  imageData: string;
  filtro: SummitFilterId;
  /** Prompt alterno para pruebas; si no viene se usa el del filtro. */
  promptOverride?: string;
  /** Modelo alterno para pruebas. */
  model?: string;
  /** Proveedor alterno para pruebas, sin tener que redesplegar. */
  provider?: SummitProvider;
  nombre?: string;
  apellido?: string;
  cedula?: string;
  correo?: string;
  autorizaDatos?: boolean;
}

export interface SummitGenerationResponse {
  success: boolean;
  /** Imagen con el marco de la campaña. Es la que se muestra y se descarga. */
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  filtro?: SummitFilterId;
  participanteId?: string | null;
  debug?: {
    originalImage?: string;
    styleReference?: string;
    portraitImage?: string;
    finalImage?: string;
    provider?: string;
    model?: string;
  };
}

/** Resolución que se le pide al modelo; el marco final mide 1123×1401. */
const RESOLUCION = "1K";

/**
 * Prepara la foto del visitante para el modelo.
 *
 * A diferencia de `optimizeImageForAI` (compartida, tope de 1024 px), aquí se
 * conserva más resolución: mientras más detalle del rostro reciba el modelo,
 * mejor conserva el parecido. La webcam captura 1600 px de lado mayor, así que
 * esto no la agranda, solo la normaliza.
 */
const optimizeVisitorPhoto = async (buffer: Buffer): Promise<Buffer> =>
  sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer();

/**
 * Servicio de generación de Claro Tech Summit 2026.
 *
 * El modelo recibe DOS imágenes en este orden:
 *   [0] la referencia del estilo elegido → IMAGE 1 en el prompt
 *   [1] la foto del visitante            → IMAGE 2 en el prompt
 * y devuelve un retrato suelto, sin marco. El marco de la campaña se compone
 * después con sharp, para que el arte quede siempre idéntico y no dependa de
 * lo que el modelo decida dibujar.
 *
 * Quién ejecuta el modelo (Replicate o fal.ai) lo decide `proveedores.ts` a
 * partir de IMAGE_PROVIDER: aquí no hay nada atado a un proveedor.
 */
class SummitImageService {
  async generate(
    request: SummitGenerationRequest,
  ): Promise<SummitGenerationResponse> {
    const requestId = generateRequestId();
    const filter = SUMMIT_FILTERS[request.filtro];
    const prompt = request.promptOverride || filter.prompt;
    const proveedor = obtenerProveedor(request.provider, request.model);

    try {
      console.log(`[SUMMIT-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
      console.log(`[SUMMIT-${requestId}] Proveedor: ${proveedor.nombre} · ${proveedor.modelo}`);

      // 1. Subir la foto del visitante y resolver la referencia de estilo.
      //    El proveedor necesita leer las dos por HTTP.
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeVisitorPhoto(imageBuffer);

      const [originalImageUrl, styleReferenceUrl] = await Promise.all([
        uploadToStorage(
          optimizedBuffer,
          SUMMIT_STORAGE.originals,
          `visitante_${requestId}.jpg`,
        ),
        getStyleReferenceUrl(filter.referenceFile),
      ]);

      console.log(`[SUMMIT-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
      console.log(`[SUMMIT-${requestId}] 🎨 Referencia: ${styleReferenceUrl}`);

      // 2. Generar: referencia primero, foto después (así las nombra el prompt)
      const portraitUrl = await retryWithBackoff(
        () =>
          proveedor.generar(
            {
              prompt,
              imagenes: [styleReferenceUrl, originalImageUrl],
              aspecto: SUMMIT_ASPECT_RATIO,
              resolucion: RESOLUCION,
            },
            requestId,
          ),
        3,
        2000,
      );

      // 3. Poner el marco de la campaña y guardar el resultado
      const portraitBuffer = await this.download(portraitUrl);
      const framedBuffer = await composeSummitFrame(portraitBuffer);

      const finalImageUrl = await uploadToStorage(
        framedBuffer,
        SUMMIT_STORAGE.generated,
        `resultado_filtro${filter.id}_${requestId}.jpg`,
      );

      console.log(`[SUMMIT-${requestId}] ✅ Listo: ${finalImageUrl}`);

      // 4. Guardar el registro del participante (no bloquea el resultado si falla)
      const participanteId = await saveSummitParticipante({
        nombre: request.nombre,
        apellido: request.apellido,
        cedula: request.cedula,
        correo: request.correo,
        autorizaDatos: request.autorizaDatos === true,
        filtro: filter.id,
        filtroLabel: filter.label,
        originalImageUrl,
        resultImageUrl: finalImageUrl,
        requestId,
        model: `${proveedor.nombre}:${proveedor.modelo}`,
      });

      return {
        success: true,
        imageUrl: finalImageUrl,
        message: `Imagen generada con el estilo ${filter.label}`,
        requestId: `summit-${requestId}`,
        filtro: filter.id,
        participanteId,
        debug: {
          originalImage: originalImageUrl,
          styleReference: styleReferenceUrl,
          portraitImage: portraitUrl,
          finalImage: finalImageUrl,
          provider: proveedor.nombre,
          model: proveedor.modelo,
        },
      };
    } catch (error) {
      console.error(`[SUMMIT-${requestId}] ❌ Falló la generación:`, error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido durante la generación",
        requestId: `summit-${requestId}`,
        filtro: request.filtro,
      };
    }
  }

  private async download(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `No se pudo descargar la imagen generada: ${response.statusText}`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

}

export default new SummitImageService();
