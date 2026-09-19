"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
const sharp_1 = __importDefault(require("sharp"));
const config_1 = require("../config");
const summit_1 = require("../config/summit");
const utils_1 = require("../utils");
const storage_1 = require("../utils/storage");
const summitAssets_1 = require("../utils/summitAssets");
const summitFrame_1 = require("../utils/summitFrame");
const summitFirestore_1 = require("../utils/summitFirestore");
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
        const filter = summit_1.SUMMIT_FILTERS[request.filtro];
        const model = request.model || summit_1.SUMMIT_MODEL;
        const prompt = request.promptOverride || filter.prompt;
        try {
            console.log(`[SUMMIT-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
            console.log(`[SUMMIT-${requestId}] Modelo: ${model}`);
            // 1. Subir la foto del visitante y resolver la referencia de estilo.
            //    Replicate necesita leer las dos por HTTP.
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await optimizeVisitorPhoto(imageBuffer);
            const [originalImageUrl, styleReferenceUrl] = await Promise.all([
                (0, storage_1.uploadToStorage)(optimizedBuffer, summit_1.SUMMIT_STORAGE.originals, `visitante_${requestId}.jpg`),
                (0, summitAssets_1.getStyleReferenceUrl)(filter.referenceFile),
            ]);
            console.log(`[SUMMIT-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
            console.log(`[SUMMIT-${requestId}] 🎨 Referencia: ${styleReferenceUrl}`);
            // 2. Generar: referencia primero, foto después (así las nombra el prompt)
            const portraitUrl = await this.runModel(styleReferenceUrl, originalImageUrl, prompt, model, requestId);
            // 3. Poner el marco de la campaña y guardar el resultado
            const portraitBuffer = await this.download(portraitUrl);
            const framedBuffer = await (0, summitFrame_1.composeSummitFrame)(portraitBuffer);
            const finalImageUrl = await (0, storage_1.uploadToStorage)(framedBuffer, summit_1.SUMMIT_STORAGE.generated, `resultado_filtro${filter.id}_${requestId}.jpg`);
            console.log(`[SUMMIT-${requestId}] ✅ Listo: ${finalImageUrl}`);
            // 4. Guardar el registro del participante (no bloquea el resultado si falla)
            const participanteId = await (0, summitFirestore_1.saveSummitParticipante)({
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
        }
        catch (error) {
            console.error(`[SUMMIT-${requestId}] ❌ Falló la generación:`, error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Error desconocido durante la generación",
                requestId: `summit-${requestId}`,
                filtro: request.filtro,
            };
        }
    }
    async runModel(styleReferenceUrl, personUrl, prompt, model, requestId) {
        const input = {
            prompt,
            // ORDEN CRÍTICO: [referencia, foto] = [IMAGE 1, IMAGE 2] del prompt
            image_input: [styleReferenceUrl, personUrl],
            aspect_ratio: summit_1.SUMMIT_ASPECT_RATIO,
            output_format: "jpg",
            resolution: "1K",
            // Sin búsquedas externas: la referencia visual son las dos imágenes adjuntas
            image_search: false,
            google_search: false,
        };
        console.log(`[SUMMIT-${requestId}] 🤖 image_input:`, input.image_input);
        console.log(`[SUMMIT-${requestId}] 🤖 prompt: ${prompt.length} chars, aspect ${input.aspect_ratio}`);
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
    async download(imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`No se pudo descargar la imagen generada: ${response.statusText}`);
        }
        return Buffer.from(await response.arrayBuffer());
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
exports.default = new SummitReplicateService();
//# sourceMappingURL=summitReplicateService.js.map