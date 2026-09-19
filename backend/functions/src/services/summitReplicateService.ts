import Replicate from "replicate";
import sharp from "sharp";
import { replicateConfig } from "../config";
import {
  SUMMIT_ASPECT_RATIO,
  SUMMIT_FILTERS,
  SUMMIT_MODEL,
  SUMMIT_STORAGE,
  SummitFilterId,
} from "../config/summit";
import { base64ToBuffer, generateRequestId, retryWithBackoff } from "../utils";
import { uploadToStorage } from "../utils/storage";
import { getStyleReferenceUrl } from "../utils/summitAssets";
import { composeSummitFrame } from "../utils/summitFrame";
import { saveSummitParticipante } from "../utils/summitFirestore";

export interface SummitGenerationRequest {
  /** Foto del visitante en base64 (data URL). */
  imageData: string;
  filtro: SummitFilterId;
  /** Prompt alterno para pruebas; si no viene se usa el del filtro. */
  promptOverride?: string;
  /** Modelo alterno para pruebas. */
  model?: string;
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
    model?: string;
  };
}

/**
 * Prepara la foto del visitante para el modelo.
 *
 * A diferencia de `optimizeImageForAI` (compartida, tope de 1024 px), aquí se
 * conserva más resolución: mientras más detalle del rostro reciba el modelo,
 * mejor conserva el parecido. La webcam captura 2048×2048, así que 1600 px
 * mantiene la cara nítida sin inflar el tiempo de subida.
 */
const optimizeVisitorPhoto = async (buffer: Buffer): Promise<Buffer> =>
  sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer();

/**
 * Servicio de Claro Tech Summit 2026.
 *
 * El modelo recibe DOS imágenes en este orden:
 *   [0] la referencia del estilo elegido → IMAGE 1 en el prompt
 *   [1] la foto del visitante            → IMAGE 2 en el prompt
 * y devuelve un retrato suelto, sin marco. El marco de la campaña se compone
 * después con sharp, para que el arte quede siempre idéntico y no dependa de
 * lo que el modelo decida dibujar.
 */
class SummitReplicateService {
  private replicate: Replicate | null = null;

  private initReplicate() {
    if (this.replicate) return this.replicate;

    if (!replicateConfig.apiToken) {
      throw new Error("REPLICATE_API_TOKEN environment variable is required");
    }

    this.replicate = new Replicate({ auth: replicateConfig.apiToken });
    return this.replicate;
  }

  async generate(
    request: SummitGenerationRequest,
  ): Promise<SummitGenerationResponse> {
    const requestId = generateRequestId();
    const filter = SUMMIT_FILTERS[request.filtro];
    const model = request.model || SUMMIT_MODEL;
    const prompt = request.promptOverride || filter.prompt;

    try {
      console.log(`[SUMMIT-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
      console.log(`[SUMMIT-${requestId}] Modelo: ${model}`);

      // 1. Subir la foto del visitante y resolver la referencia de estilo.
      //    Replicate necesita leer las dos por HTTP.
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
      const portraitUrl = await this.runModel(
        styleReferenceUrl,
        originalImageUrl,
        prompt,
        model,
        requestId,
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
        model,
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
          model,
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

  private async runModel(
    styleReferenceUrl: string,
    personUrl: string,
    prompt: string,
    model: string,
    requestId: string,
  ): Promise<string> {
    const input = {
      prompt,
      // ORDEN CRÍTICO: [referencia, foto] = [IMAGE 1, IMAGE 2] del prompt
      image_input: [styleReferenceUrl, personUrl],
      aspect_ratio: SUMMIT_ASPECT_RATIO,
      output_format: "jpg",
      resolution: "1K",
      // Sin búsquedas externas: la referencia visual son las dos imágenes adjuntas
      image_search: false,
      google_search: false,
    };

    console.log(`[SUMMIT-${requestId}] 🤖 image_input:`, input.image_input);
    console.log(
      `[SUMMIT-${requestId}] 🤖 prompt: ${prompt.length} chars, aspect ${input.aspect_ratio}`,
    );

    const output = await retryWithBackoff(
      async () => this.initReplicate().run(model as any, { input }),
      3,
      2000,
    );

    return this.extractUrl(output);
  }

  /** Normaliza las distintas formas en que Replicate devuelve la salida. */
  private extractUrl(output: unknown): string {
    if (Array.isArray(output)) {
      const first = output[0];
      if (first && typeof first === "object" && "url" in (first as any)) {
        return (first as any).url().toString();
      }
      return String(first);
    }

    if (output && typeof output === "object" && "url" in (output as any)) {
      return (output as any).url().toString();
    }

    if (typeof output === "string") return output;

    throw new Error("Formato de salida inesperado del modelo");
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

  async checkStatus(predictionId: string) {
    const prediction = await this.initReplicate().predictions.get(predictionId);

    return {
      id: predictionId,
      status:
        prediction.status === "succeeded"
          ? "completed"
          : prediction.status === "failed"
            ? "failed"
            : "processing",
      imageUrl: prediction.output
        ? ((Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output) as string)
        : undefined,
      error: prediction.error?.toString(),
      createdAt: new Date(prediction.created_at),
      completedAt: prediction.completed_at
        ? new Date(prediction.completed_at)
        : undefined,
    };
  }
}

export default new SummitReplicateService();
