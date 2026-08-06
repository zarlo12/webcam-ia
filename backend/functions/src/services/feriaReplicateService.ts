import Replicate from "replicate";
import sharp from "sharp";
import { replicateConfig } from "../config";
import {
  FERIA_ASPECT_RATIO,
  FERIA_FILTERS,
  FERIA_MODEL,
  FERIA_STORAGE,
  FeriaFilterId,
} from "../config/feria";
import { base64ToBuffer, generateRequestId, retryWithBackoff } from "../utils";
import { uploadToStorage } from "../utils/storage";
import { saveFeriaParticipante } from "../utils/feriaFirestore";

export interface FeriaGenerationRequest {
  /** Foto del visitante en base64 (data URL). */
  imageData: string;
  filtro: FeriaFilterId;
  /** Prompt alterno para pruebas; si no viene se usa el del filtro. */
  promptOverride?: string;
  /** Modelo alterno para pruebas. */
  model?: string;
  nombre?: string;
  cedula?: string;
  celular?: string;
  correo?: string;
}

export interface FeriaGenerationResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  filtro?: FeriaFilterId;
  participanteId?: string | null;
  debug?: {
    originalImage?: string;
    templateImage?: string;
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
 * Servicio de la campaña "Antioquia nos enseña a llegar lejos".
 *
 * El modelo recibe DOS imágenes en este orden:
 *   [0] la plantilla del filtro  → IMAGE 1 en el prompt
 *   [1] la foto del visitante    → IMAGE 2 en el prompt
 * y se le pide sustituir a la persona de la plantilla por la de la foto.
 */
class FeriaReplicateService {
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
    request: FeriaGenerationRequest,
  ): Promise<FeriaGenerationResponse> {
    const requestId = generateRequestId();
    const filter = FERIA_FILTERS[request.filtro];
    const model = request.model || FERIA_MODEL;
    const prompt = request.promptOverride || filter.prompt;

    try {
      console.log(`[FERIA-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
      console.log(`[FERIA-${requestId}] Plantilla: ${filter.templateUrl}`);
      console.log(`[FERIA-${requestId}] Modelo: ${model}`);

      // 1. Subir la foto del visitante para tener una URL pública que Replicate pueda leer
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeVisitorPhoto(imageBuffer);

      const originalImageUrl = await uploadToStorage(
        optimizedBuffer,
        FERIA_STORAGE.originals,
        `visitante_${requestId}.jpg`,
      );

      console.log(`[FERIA-${requestId}] 📤 Foto subida: ${originalImageUrl}`);

      // 2. Generar: plantilla primero, foto después (así los nombra el prompt)
      const generatedUrl = await this.runModel(
        filter.templateUrl,
        originalImageUrl,
        prompt,
        model,
        requestId,
      );

      // 3. Persistir el resultado en nuestro Storage
      const finalImageUrl = await this.downloadAndStore(
        generatedUrl,
        `resultado_filtro${filter.id}_${requestId}.jpg`,
      );

      console.log(`[FERIA-${requestId}] ✅ Listo: ${finalImageUrl}`);

      // 4. Guardar el registro del participante (no bloquea el resultado si falla)
      const participanteId = await saveFeriaParticipante({
        nombre: request.nombre,
        cedula: request.cedula,
        celular: request.celular,
        correo: request.correo,
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
        message: `Foto generada con ${filter.label}`,
        requestId: `feria-${requestId}`,
        filtro: filter.id,
        participanteId,
        debug: {
          originalImage: originalImageUrl,
          templateImage: filter.templateUrl,
          finalImage: finalImageUrl,
          model,
        },
      };
    } catch (error) {
      console.error(`[FERIA-${requestId}] ❌ Falló la generación:`, error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido durante la generación",
        requestId: `feria-${requestId}`,
        filtro: request.filtro,
      };
    }
  }

  private async runModel(
    templateUrl: string,
    personUrl: string,
    prompt: string,
    model: string,
    requestId: string,
  ): Promise<string> {
    const input = {
      prompt,
      // ORDEN CRÍTICO: [plantilla, foto] = [IMAGE 1, IMAGE 2] del prompt
      image_input: [templateUrl, personUrl],
      aspect_ratio: FERIA_ASPECT_RATIO,
      output_format: "jpg",
      resolution: "2K",
      // Sin búsquedas externas: la referencia visual son las dos imágenes adjuntas
      image_search: false,
      google_search: false,
    };

    console.log(`[FERIA-${requestId}] 🤖 image_input:`, input.image_input);
    console.log(
      `[FERIA-${requestId}] 🤖 prompt: ${prompt.length} chars, aspect ${input.aspect_ratio}`,
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

  private async downloadAndStore(
    imageUrl: string,
    filename: string,
  ): Promise<string> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `No se pudo descargar la imagen generada: ${response.statusText}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return await uploadToStorage(buffer, FERIA_STORAGE.generated, filename);
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

export default new FeriaReplicateService();
