"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const datatech_1 = require("../config/datatech");
const utils_1 = require("../utils");
const storage_1 = require("../utils/storage");
const datatechAssets_1 = require("../utils/datatechAssets");
const datatechFirestore_1 = require("../utils/datatechFirestore");
const chatAgente_1 = require("../utils/chatAgente");
const proveedores_1 = require("./proveedores");
/**
 * Resolución que se le pide al proveedor. Se pide 2K y se baja después: el
 * modelo cuida más el texto del póster cuando trabaja en grande, y el titular
 * y los logos son justo lo que no puede salir borroso.
 */
const RESOLUCION = "2K";
/** Medida final del póster: la de las plantillas y la de una story. */
const POSTER = { ancho: 1080, alto: 1920 };
/**
 * Prepara la foto del visitante para el modelo.
 *
 * Mientras más detalle del rostro reciba, mejor conserva el parecido. La
 * webcam captura 1600 px de lado mayor, así que esto no la agranda: la
 * normaliza y le quita peso a la subida.
 */
const optimizarFoto = async (buffer) => (0, sharp_1.default)(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer();
/**
 * Servicio de generación de Claro media · DATA TECH.
 *
 * El modelo recibe DOS imágenes en este orden:
 *   [0] la plantilla del póster elegido → IMAGE 1 en el prompt
 *   [1] la foto del visitante           → IMAGE 2 en el prompt
 * y devuelve el póster terminado.
 *
 * A diferencia del Summit, aquí NO se compone ningún marco después: la
 * plantilla ya trae el titular, el badge y los logos, así que lo que devuelve
 * el modelo se guarda tal cual.
 *
 * Quién ejecuta el modelo (Replicate o fal.ai) lo decide `proveedores.ts` a
 * partir de IMAGE_PROVIDER, igual que en las demás campañas.
 */
class DatatechImageService {
    async generate(request) {
        const requestId = (0, utils_1.generateRequestId)();
        const plantilla = datatech_1.DATATECH_PLANTILLAS[request.plantilla];
        const prompt = request.promptOverride || plantilla.prompt;
        const proveedor = (0, proveedores_1.obtenerProveedor)(request.provider, request.model);
        try {
            console.log(`[DATATECH-${requestId}] ▶ Plantilla ${plantilla.id} (${plantilla.palabra})`);
            console.log(`[DATATECH-${requestId}] Proveedor: ${proveedor.nombre} · ${proveedor.modelo}`);
            // 1. Subir la foto del visitante y resolver la plantilla.
            //    El proveedor necesita leer las dos por HTTP.
            const fotoBuffer = await optimizarFoto((0, utils_1.base64ToBuffer)(request.imageData));
            const [originalImageUrl, templateUrl] = await Promise.all([
                (0, storage_1.uploadToStorage)(fotoBuffer, datatech_1.DATATECH_STORAGE.originals, `visitante_${requestId}.jpg`),
                (0, datatechAssets_1.getPlantillaUrl)(plantilla.templateFile),
            ]);
            console.log(`[DATATECH-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
            console.log(`[DATATECH-${requestId}] 🖼️  Plantilla: ${templateUrl}`);
            // 2. Generar: plantilla primero, foto después (así las nombra el prompt)
            const posterUrl = await (0, utils_1.retryWithBackoff)(() => proveedor.generar({
                prompt,
                imagenes: [templateUrl, originalImageUrl],
                aspecto: datatech_1.DATATECH_ASPECT_RATIO,
                resolucion: RESOLUCION,
            }, requestId), 3, 2000);
            // 3. Persistir el póster en nuestro Storage. Lo que devuelve el modelo ya
            //    es la pieza final: no se le compone nada encima, solo se normaliza
            //    el tamaño (en 2K sale cerca de 1 MB, demasiado para descargarlo por
            //    QR con el wifi de un evento).
            const posterBuffer = await this.descargar(posterUrl);
            const finalImageUrl = await (0, storage_1.uploadToStorage)(await this.normalizar(posterBuffer), datatech_1.DATATECH_STORAGE.generated, `poster_plantilla${plantilla.id}_${requestId}.jpg`);
            console.log(`[DATATECH-${requestId}] ✅ Listo: ${finalImageUrl}`);
            // 4. Guardar los registros. Ninguno bloquea el resultado si falla.
            //
            //    Son dos escrituras con dueños distintos: el registro propio del
            //    kiosco, que alimenta su panel, y —si el visitante vino del chat— el
            //    documento de su conversación, para que propuesta y póster queden en
            //    el mismo expediente.
            const modelo = `${proveedor.nombre}:${proveedor.modelo}`;
            const [participanteId, enlazadoAlChat] = await Promise.all([
                (0, datatechFirestore_1.saveDatatechParticipante)({
                    correo: request.correo,
                    plantilla: plantilla.id,
                    plantillaPalabra: plantilla.palabra,
                    originalImageUrl,
                    resultImageUrl: finalImageUrl,
                    requestId,
                    model: modelo,
                    chatDocId: request.chatDocId,
                }),
                request.chatDocId
                    ? (0, chatAgente_1.guardarPosterEnChat)(request.chatDocId, {
                        plantilla: plantilla.id,
                        plantillaPalabra: plantilla.palabra,
                        posterUrl: finalImageUrl,
                        originalImageUrl,
                        requestId,
                        model: modelo,
                    })
                    : Promise.resolve(false),
            ]);
            return {
                success: true,
                imageUrl: finalImageUrl,
                message: `Póster generado con la plantilla ${plantilla.palabra}`,
                requestId: `datatech-${requestId}`,
                plantilla: plantilla.id,
                participanteId,
                enlazadoAlChat,
                debug: {
                    originalImage: originalImageUrl,
                    templateImage: templateUrl,
                    finalImage: finalImageUrl,
                    provider: proveedor.nombre,
                    model: proveedor.modelo,
                },
            };
        }
        catch (error) {
            console.error(`[DATATECH-${requestId}] ❌ Falló la generación:`, error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Error desconocido durante la generación",
                requestId: `datatech-${requestId}`,
                plantilla: request.plantilla,
            };
        }
    }
    /**
     * Deja el póster en 1080×1920.
     *
     * `cover` no recorta nada apreciable: el modelo ya devuelve 9:16, así que
     * solo se ajusta el tamaño.
     */
    async normalizar(buffer) {
        return (0, sharp_1.default)(buffer)
            .resize(POSTER.ancho, POSTER.alto, { fit: "cover" })
            .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
            .toBuffer();
    }
    async descargar(url) {
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error(`No se pudo descargar el póster generado: ${respuesta.statusText}`);
        }
        return Buffer.from(await respuesta.arrayBuffer());
    }
}
exports.default = new DatatechImageService();
//# sourceMappingURL=datatechImageService.js.map