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
exports.getSummitStatus = exports.listSummitParticipantes = exports.summitHealthCheck = exports.generateSummitImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const summitImageService_1 = __importDefault(require("../services/summitImageService"));
const proveedores_1 = require("../services/proveedores");
const summit_1 = require("../config/summit");
const multipart_1 = require("../utils/multipart");
/** El formulario viaja como multipart, así que los booleanos llegan de texto. */
const toBoolean = (value) => value === true || value === "true" || value === "1";
/** Valida el payload y devuelve la request lista, o un mensaje de error. */
function buildRequest(imageData, payload) {
    const filtro = Number(payload.filtro);
    if (!(0, summit_1.isSummitFilterId)(filtro)) {
        return {
            error: `El campo 'filtro' es obligatorio y debe ser 1, 2, 3 o 4. Se recibió: ${JSON.stringify(payload.filtro)}`,
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
            filtro,
            promptOverride: payload.prompt?.trim() || undefined,
            model: payload.model?.trim() || undefined,
            provider: provider || undefined,
            nombre: payload.nombre?.trim() || undefined,
            apellido: payload.apellido?.trim() || undefined,
            cedula: payload.cedula?.trim() || undefined,
            correo: payload.correo?.trim().toLowerCase() || undefined,
            autorizaDatos: toBoolean(payload.autorizaDatos),
        },
    };
}
exports.generateSummitImage = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
}, async (req, res) => {
    console.log("\n🔴 ===== SUMMIT · GENERAR IMAGEN =====");
    console.log(`🔴 ${req.method} · ${req.get("content-type")}`);
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
            console.log(`🔴 📦 Body: ${body.length} bytes`);
            const { fields, files } = (0, multipart_1.parseMultipartData)(body, boundary);
            const imageBuffer = files.image;
            if (!imageBuffer || imageBuffer.length === 0) {
                console.error("🔴 ❌ Sin archivo de imagen", {
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
            console.log(`🔴 ✅ Foto recibida: ${imageBuffer.length} bytes (${mimeType})`);
            const { request, error } = buildRequest(imageData, fields);
            if (!request) {
                res.status(400).json({ success: false, error });
                return;
            }
            const result = await summitImageService_1.default.generate(request);
            console.log(`🔴 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
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
            const { request, error } = buildRequest(imageData, payload);
            if (!request) {
                res.status(400).json({ success: false, error });
                return;
            }
            const result = await summitImageService_1.default.generate(request);
            console.log(`🔴 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
            res.status(result.success ? 200 : 400).json(result);
            return;
        }
        res.status(400).json({
            success: false,
            error: "Content-Type no soportado. Usa multipart/form-data o application/json.",
        });
    }
    catch (error) {
        console.error("🔴 ❌ Error no controlado:", error);
        res.status(500).json({
            success: false,
            error: "Error interno generando la imagen del Summit",
        });
    }
});
exports.summitHealthCheck = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "us-central1",
}, async (_req, res) => {
    res.status(200).json({
        success: true,
        service: "Claro Tech Summit 2026 · Soluciones Digitales",
        message: "🔴 Servicio activo",
        timestamp: new Date().toISOString(),
        version: "1.1.0",
        // Lo primero que hay que poder ver en una caída: quién está generando.
        provider: (0, proveedores_1.proveedorActivo)(),
        model: summit_1.SUMMIT_MODELS[(0, proveedores_1.proveedorActivo)()],
        providersDisponibles: summit_1.SUMMIT_MODELS,
        falKeyConfigurada: !!process.env.FAL_KEY,
        replicateTokenConfigurado: !!process.env.REPLICATE_API_TOKEN,
        storage: summit_1.SUMMIT_STORAGE,
        collection: summit_1.SUMMIT_COLLECTION,
        filters: Object.values(summit_1.SUMMIT_FILTERS).map((f) => ({
            filtro: f.id,
            label: f.label,
            referenceFile: f.referenceFile,
            promptLength: f.prompt.length,
        })),
    });
});
/**
 * Listado de participantes para el panel de registros.
 *
 * Es de lectura y deliberadamente ABIERTO: así lo pidió el cliente. Las reglas
 * de Firestore siguen cerradas —quien lee aquí es el Admin SDK—, de modo que la
 * colección no queda expuesta a internet: solo lo que devuelve este endpoint.
 *
 * OJO: devuelve datos personales (nombre, cédula, correo). Para cerrarlo basta
 * con exigir un token: descomentar el bloque de PANEL_TOKEN de abajo y definir
 * la variable en el .env de las funciones.
 *
 * Pagina por cursor en vez de traerlo todo de golpe, para que un evento con
 * miles de registros no reviente la memoria de la función.
 */
exports.listSummitParticipantes = (0, https_1.onRequest)({
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
            .collection(summit_1.SUMMIT_COLLECTION)
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
                nombre: data.nombre ?? "",
                apellido: data.apellido ?? "",
                cedula: data.cedula ?? "",
                correo: data.correo ?? "",
                autorizaDatos: data.autorizaDatos === true,
                filtro: data.filtro ?? null,
                filtroLabel: data.filtroLabel ?? "",
                originalImageUrl: data.originalImageUrl ?? "",
                resultImageUrl: data.resultImageUrl ?? "",
                model: data.model ?? "",
                requestId: data.requestId ?? "",
                // ISO para que el panel no dependa del formato de Firestore.
                createdAt: createdAt ? createdAt.toDate().toISOString() : null,
            };
        });
        const last = snapshot.docs[snapshot.docs.length - 1];
        const lastCreatedAt = last?.get("createdAt");
        res.status(200).json({
            success: true,
            collection: summit_1.SUMMIT_COLLECTION,
            count: items.length,
            // Ausente cuando ya no hay más páginas.
            nextCursor: snapshot.size === limit && last && lastCreatedAt
                ? `${lastCreatedAt.toMillis()}|${last.id}`
                : null,
            items,
        });
    }
    catch (error) {
        console.error("🔴 Error listando participantes:", error);
        res.status(500).json({
            success: false,
            error: "No se pudo leer el listado de participantes",
        });
    }
});
exports.getSummitStatus = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1",
}, async (req, res) => {
    try {
        const predictionId = req.query.predictionId;
        if (!predictionId) {
            res
                .status(400)
                .json({ success: false, error: "predictionId es obligatorio" });
            return;
        }
        const status = await (0, proveedores_1.estadoReplicate)(predictionId);
        res.status(200).json({ success: true, data: status });
    }
    catch (error) {
        console.error("🔴 Error consultando estado:", error);
        res
            .status(500)
            .json({ success: false, error: "No se pudo consultar el estado" });
    }
});
//# sourceMappingURL=summitController.js.map