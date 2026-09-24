"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const summit_1 = require("../config/summit");
const utils_1 = require("../utils");
const storage_1 = require("../utils/storage");
const summitAssets_1 = require("../utils/summitAssets");
const summitFrame_1 = require("../utils/summitFrame");
const summitFirestore_1 = require("../utils/summitFirestore");
const proveedores_1 = require("./proveedores");
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
const optimizeVisitorPhoto = async (buffer) => (0, sharp_1.default)(buffer)
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
    async generate(request) {
        const requestId = (0, utils_1.generateRequestId)();
        const filter = summit_1.SUMMIT_FILTERS[request.filtro];
        const prompt = request.promptOverride || filter.prompt;
        const proveedor = (0, proveedores_1.obtenerProveedor)(request.provider, request.model);
        try {
            console.log(`[SUMMIT-${requestId}] ▶ Filtro ${filter.id} (${filter.label})`);
            console.log(`[SUMMIT-${requestId}] Proveedor: ${proveedor.nombre} · ${proveedor.modelo}`);
            // 1. Subir la foto del visitante y resolver la referencia de estilo.
            //    El proveedor necesita leer las dos por HTTP.
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await optimizeVisitorPhoto(imageBuffer);
            const [originalImageUrl, styleReferenceUrl] = await Promise.all([
                (0, storage_1.uploadToStorage)(optimizedBuffer, summit_1.SUMMIT_STORAGE.originals, `visitante_${requestId}.jpg`),
                (0, summitAssets_1.getStyleReferenceUrl)(filter.referenceFile),
            ]);
            console.log(`[SUMMIT-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
            console.log(`[SUMMIT-${requestId}] 🎨 Referencia: ${styleReferenceUrl}`);
            // 2. Generar: referencia primero, foto después (así las nombra el prompt)
            const portraitUrl = await (0, utils_1.retryWithBackoff)(() => proveedor.generar({
                prompt,
                imagenes: [styleReferenceUrl, originalImageUrl],
                aspecto: summit_1.SUMMIT_ASPECT_RATIO,
                resolucion: RESOLUCION,
            }, requestId), 3, 2000);
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
    async download(imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`No se pudo descargar la imagen generada: ${response.statusText}`);
        }
        return Buffer.from(await response.arrayBuffer());
    }
}
exports.default = new SummitImageService();
//# sourceMappingURL=summitImageService.js.map