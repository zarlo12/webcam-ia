"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
const sharp_1 = __importDefault(require("sharp"));
const config_1 = require("../config");
const feria_1 = require("../config/feria");
const utils_1 = require("../utils");
const storage_1 = require("../utils/storage");
const feriaFirestore_1 = require("../utils/feriaFirestore");
/**
 * Prepara la foto del visitante para el modelo.
 *
 * A diferencia de `optimizeImageForAI` (compartida, tope de 1024 px), aquí se
 * conserva más resolución: mientras más detalle del rostro reciba el modelo,
 * mejor conserva el parecido. La webcam captura 2048×2048, así que 1600 px
 * mantiene la cara nítida sin inflar el tiempo de subida.
 */
const optimizeVisitorPhoto = async (buffer) => (0, sharp_1.default)(buffer)
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
    replicate = null;
    initReplicate() {
        if (this.replicate)
            return this.replicate;
        if (!config_1.replicateConfig.apiToken) {
            throw new Error("REPLICATE_API_TOKEN environment variable is required");
        }
        this.replicate = new replicate_1.default({ auth: config_1.replicateConfig.apiToken });
        return this.replicate;
    }
    async generate(request) {
        const requestId = (0, utils_1.generateRequestId)();
        const filter = feria_1.FERIA_FILTERS[request.filtro];
        const model = request.model || feria_1.FERIA_MODEL;
        const prompt = request.promptOverride || filter.prompt;
        try {
            console.log(`[FERIA-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
            console.log(`[FERIA-${requestId}] Plantilla: ${filter.templateUrl}`);
            console.log(`[FERIA-${requestId}] Modelo: ${model}`);
            // 1. Subir la foto del visitante para tener una URL pública que Replicate pueda leer
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await optimizeVisitorPhoto(imageBuffer);
            const originalImageUrl = await (0, storage_1.uploadToStorage)(optimizedBuffer, feria_1.FERIA_STORAGE.originals, `visitante_${requestId}.jpg`);
            console.log(`[FERIA-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
            // 2. Generar: plantilla primero, foto después (así los nombra el prompt)
            const generatedUrl = await this.runModel(filter.templateUrl, originalImageUrl, prompt, model, requestId);
            // 3. Persistir el resultado en nuestro Storage
            const finalImageUrl = await this.downloadAndStore(generatedUrl, `resultado_filtro${filter.id}_${requestId}.jpg`);
            console.log(`[FERIA-${requestId}] ✅ Listo: ${finalImageUrl}`);
            // 4. Guardar el registro del participante (no bloquea el resultado si falla)
            const participanteId = await (0, feriaFirestore_1.saveFeriaParticipante)({
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
        }
        catch (error) {
            console.error(`[FERIA-${requestId}] ❌ Falló la generación:`, error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Error desconocido durante la generación",
                requestId: `feria-${requestId}`,
                filtro: request.filtro,
            };
        }
    }
    async runModel(templateUrl, personUrl, prompt, model, requestId) {
        const input = {
            prompt,
            // ORDEN CRÍTICO: [plantilla, foto] = [IMAGE 1, IMAGE 2] del prompt
            image_input: [templateUrl, personUrl],
            aspect_ratio: feria_1.FERIA_ASPECT_RATIO,
            output_format: "jpg",
            resolution: "1K",
            // Sin búsquedas externas: la referencia visual son las dos imágenes adjuntas
            image_search: false,
            google_search: false,
        };
        console.log(`[FERIA-${requestId}] 🤖 image_input:`, input.image_input);
        console.log(`[FERIA-${requestId}] 🤖 prompt: ${prompt.length} chars, aspect ${input.aspect_ratio}`);
        const output = await (0, utils_1.retryWithBackoff)(async () => this.initReplicate().run(model, { input }), 3, 2000);
        return this.extractUrl(output);
    }
    /** Normaliza las distintas formas en que Replicate devuelve la salida. */
    extractUrl(output) {
        if (Array.isArray(output)) {
            const first = output[0];
            if (first && typeof first === "object" && "url" in first) {
                return first.url().toString();
            }
            return String(first);
        }
        if (output && typeof output === "object" && "url" in output) {
            return output.url().toString();
        }
        if (typeof output === "string")
            return output;
        throw new Error("Formato de salida inesperado del modelo");
    }
    async downloadAndStore(imageUrl, filename) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`No se pudo descargar la imagen generada: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        return await (0, storage_1.uploadToStorage)(buffer, feria_1.FERIA_STORAGE.generated, filename);
    }
    async checkStatus(predictionId) {
        const prediction = await this.initReplicate().predictions.get(predictionId);
        return {
            id: predictionId,
            status: prediction.status === "succeeded"
                ? "completed"
                : prediction.status === "failed"
                    ? "failed"
                    : "processing",
            imageUrl: prediction.output
                ? (Array.isArray(prediction.output)
                    ? prediction.output[0]
                    : prediction.output)
                : undefined,
            error: prediction.error?.toString(),
            createdAt: new Date(prediction.created_at),
            completedAt: prediction.completed_at
                ? new Date(prediction.completed_at)
                : undefined,
        };
    }
}
exports.default = new FeriaReplicateService();
//# sourceMappingURL=feriaReplicateService.js.map