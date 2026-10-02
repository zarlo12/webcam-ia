"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDatatechParticipantes = exports.datatechHealthCheck = exports.generateDatatechImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const datatechImageService_1 = __importDefault(require("../services/datatechImageService"));
const proveedores_1 = require("../services/proveedores");
const summit_1 = require("../config/summit");
const datatech_1 = require("../config/datatech");
const chatAgente_1 = require("../utils/chatAgente");
const multipart_1 = require("../utils/multipart");
/** Valida el payload y devuelve la request lista, o un mensaje de error. */
function construirPeticion(imageData, payload) {
    const plantilla = Number(payload.plantilla);
    if (!(0, datatech_1.isDatatechPlantillaId)(plantilla)) {
        return {
            error: `El campo 'plantilla' es obligatorio y debe ser 1, 2, 3, 4 o 5. Se recibió: ${JSON.stringify(payload.plantilla)}`,
        };
    }
    const pedido = payload.provider?.trim().toLowerCase();
    let provider;
    if (pedido) {
        if (!(0, proveedores_1.esProveedorValido)(pedido)) {
            return { error: `'provider' debe ser 'replicate' o 'fal'. Se recibió: ${pedido}` };
        }
        provider = pedido;
    }
    return {
        request: {
            imageData,
            plantilla,
            promptOverride: payload.prompt?.trim() || undefined,
            model: payload.model?.trim() || undefined,
            provider,
            correo: payload.correo?.trim().toLowerCase() || undefined,
            chatDocId: payload.chatDocId?.trim() || undefined,
        },
    };
}
exports.generateDatatechImage = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
}, async (req, res) => {
    console.log("\n🟠 ===== DATA TECH · GENERAR PÓSTER =====");
    console.log(`🟠 ${req.method} · ${req.get("content-type")}`);
    try {
        if (req.method !== "POST") {
            res
                .status(405)
                .json({ success: false, error: "Método no permitido. Usa POST." });
            return;
        }
        const contentType = req.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {
            const boundary = (0, multipart_1.getBoundary)(contentType);
            if (!boundary) {
                res.status(400).json({
                    success: false,
                    error: "No se encontró el boundary en el content-type",
                });
                return;
            }
            const body = await (0, multipart_1.readRequestBody)(req);
            console.log(`🟠 📦 Body: ${body.length} bytes`);
            const { fields, files } = (0, multipart_1.parseMultipartData)(body, boundary);
            const imageBuffer = files.image;
            if (!imageBuffer || imageBuffer.length === 0) {
                console.error("🟠 ❌ Sin archivo de imagen", {
                    files: Object.keys(files),
                    fields: Object.keys(fields),
                });
                res.status(400).json({
                    success: false,
                    error: "No se recibió la foto. Envíala en el campo 'image'.",
                });
                return;
            }
            const mimeType = (0, multipart_1.detectImageMime)(imageBuffer);
            const imageData = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
            console.log(`🟠 ✅ Foto recibida: ${imageBuffer.length} bytes (${mimeType})`);
            const { request, error } = construirPeticion(imageData, fields);
            if (!request) {
                res.status(400).json({ success: false, error });
                return;
            }
            const result = await datatechImageService_1.default.generate(request);
            console.log(`🟠 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
            res.status(result.success ? 200 : 400).json(result);
            return;
        }
        if (contentType.includes("application/json")) {
            const { imageData, ...payload } = req.body || {};
            if (!imageData || typeof imageData !== "string") {
                res
                    .status(400)
                    .json({ success: false, error: "imageData es obligatorio" });
                return;
            }
            if (!imageData.startsWith("data:image/")) {
                res.status(400).json({
                    success: false,
                    error: "imageData debe ser una data URL base64 de imagen",
                });
                return;
            }
            const { request, error } = construirPeticion(imageData, payload);
            if (!request) {
                res.status(400).json({ success: false, error });
                return;
            }
            const result = await datatechImageService_1.default.generate(request);
            console.log(`🟠 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
            res.status(result.success ? 200 : 400).json(result);
            return;
        }
        res.status(400).json({
            success: false,
            error: "Content-Type no soportado. Usa multipart/form-data o application/json.",
        });
    }
    catch (error) {
        console.error("🟠 ❌ Error no controlado:", error);
        res.status(500).json({
            success: false,
            error: "Error interno generando el póster",
        });
    }
});
exports.datatechHealthCheck = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "us-central1",
}, async (_req, res) => {
    res.status(200).json({
        success: true,
        service: "Claro media · DATA TECH — 15 minutos",
        message: "🟠 Servicio activo",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        provider: (0, proveedores_1.proveedorActivo)(),
        model: summit_1.SUMMIT_MODELS[(0, proveedores_1.proveedorActivo)()],
        falKeyConfigurada: !!process.env.FAL_KEY,
        replicateTokenConfigurado: !!process.env.REPLICATE_API_TOKEN,
        aspectRatio: "9:16",
        storage: datatech_1.DATATECH_STORAGE,
        collection: datatech_1.DATATECH_COLLECTION,
        // Cuando el visitante llega desde el chat, el póster se guarda también
        // en su documento de esta colección.
        chatCollection: chatAgente_1.CHAT_COLLECTION,
        plantillas: Object.values(datatech_1.DATATECH_PLANTILLAS).map((p) => ({
            plantilla: p.id,
            palabra: p.palabra,
            titular: p.titular,
            templateFile: p.templateFile,
            promptLength: p.prompt.length,
        })),
    });
});
/**
 * Listado de participantes para el panel de registros.
 *
 * Mismo patrón que en el Summit: lee con el Admin SDK, así que las reglas de
 * Firestore siguen cerradas y lo único expuesto es lo que devuelve este
 * endpoint, no la colección.
 *
 * OJO: devuelve el correo de los asistentes. Para cerrarlo basta con exigir un
 * token: descomentar el bloque de PANEL_TOKEN y definir la variable en el .env.
 */
exports.listDatatechParticipantes = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1",
}, async (req, res) => {
    // Para proteger el panel, descomentar:
    // if (req.query.token !== process.env.PANEL_TOKEN) {
    //   res.status(401).json({ success: false, error: "No autorizado" });
    //   return;
    // }
    try {
        const limit = Math.min(Number(req.query.limit) || 500, 1000);
        const cursor = req.query.cursor;
        let query = admin
            .firestore()
            .collection(datatech_1.DATATECH_COLLECTION)
            .orderBy("createdAt", "desc")
            .orderBy(admin.firestore.FieldPath.documentId(), "desc");
        if (cursor) {
            const [millis, id] = cursor.split("|");
            query = query.startAfter(admin.firestore.Timestamp.fromMillis(Number(millis)), id);
        }
        const snapshot = await query.limit(limit).get();
        const items = snapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt;
            return {
                id: doc.id,
                correo: data.correo ?? "",
                plantilla: data.plantilla ?? null,
                plantillaPalabra: data.plantillaPalabra ?? "",
                originalImageUrl: data.originalImageUrl ?? "",
                resultImageUrl: data.resultImageUrl ?? "",
                model: data.model ?? "",
                requestId: data.requestId ?? "",
                createdAt: createdAt ? createdAt.toDate().toISOString() : null,
            };
        });
        const last = snapshot.docs[snapshot.docs.length - 1];
        const lastCreatedAt = last?.get("createdAt");
        res.status(200).json({
            success: true,
            collection: datatech_1.DATATECH_COLLECTION,
            count: items.length,
            nextCursor: snapshot.size === limit && last && lastCreatedAt
                ? `${lastCreatedAt.toMillis()}|${last.id}`
                : null,
            items,
        });
    }
    catch (error) {
        console.error("🟠 Error listando participantes:", error);
        res.status(500).json({
            success: false,
            error: "No se pudo leer el listado de participantes",
        });
    }
});
//# sourceMappingURL=datatechController.js.map