"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeriaStatus = exports.feriaHealthCheck = exports.generateFeriaImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const feriaReplicateService_1 = __importDefault(require("../services/feriaReplicateService"));
const feria_1 = require("../config/feria");
const multipart_1 = require("../utils/multipart");
/** Valida el payload y devuelve la request lista, o un mensaje de error. */
function buildRequest(imageData, payload) {
    const filtro = Number(payload.filtro);
    if (!(0, feria_1.isFeriaFilterId)(filtro)) {
        return {
            error: `El campo 'filtro' es obligatorio y debe ser 1, 2 o 3. Se recibió: ${JSON.stringify(payload.filtro)}`,
        };
    }
    return {
        request: {
            imageData,
            filtro,
            promptOverride: payload.prompt?.trim() || undefined,
            model: payload.model?.trim() || undefined,
            nombre: payload.nombre?.trim() || undefined,
            cedula: payload.cedula?.trim() || undefined,
            celular: payload.celular?.trim() || undefined,
            correo: payload.correo?.trim().toLowerCase() || undefined,
        },
    };
}
exports.generateFeriaImage = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
}, async (req, res) => {
    console.log("\n🌺 ===== FERIA · GENERAR FOTO =====");
    console.log(`🌺 ${req.method} · ${req.get("content-type")}`);
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
            console.log(`🌺 📦 Body: ${body.length} bytes`);
            const { fields, files } = (0, multipart_1.parseMultipartData)(body, boundary);
            const imageBuffer = files.image;
            if (!imageBuffer || imageBuffer.length === 0) {
                console.error("🌺 ❌ Sin archivo de imagen", {
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
            console.log(`🌺 ✅ Foto recibida: ${imageBuffer.length} bytes (${mimeType})`);
            const { request, error } = buildRequest(imageData, fields);
            if (!request) {
                res.status(400).json({ success: false, error });
                return;
            }
            const result = await feriaReplicateService_1.default.generate(request);
            console.log(`🌺 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
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
            const result = await feriaReplicateService_1.default.generate(request);
            console.log(`🌺 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
            res.status(result.success ? 200 : 400).json(result);
            return;
        }
        res.status(400).json({
            success: false,
            error: "Content-Type no soportado. Usa multipart/form-data o application/json.",
        });
    }
    catch (error) {
        console.error("🌺 ❌ Error no controlado:", error);
        res.status(500).json({
            success: false,
            error: "Error interno generando la foto de la Feria",
        });
    }
});
exports.feriaHealthCheck = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "us-central1",
}, async (_req, res) => {
    res.status(200).json({
        success: true,
        service: "Feria de las Flores · Antioquia nos enseña a llegar lejos",
        message: "🌺 Servicio activo",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        model: feria_1.FERIA_MODEL,
        storage: feria_1.FERIA_STORAGE,
        collection: feria_1.FERIA_COLLECTION,
        filters: Object.values(feria_1.FERIA_FILTERS).map((f) => ({
            filtro: f.id,
            label: f.label,
            templateUrl: f.templateUrl,
            promptLength: f.prompt.length,
        })),
    });
});
exports.getFeriaStatus = (0, https_1.onRequest)({
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
        const status = await feriaReplicateService_1.default.checkStatus(predictionId);
        res.status(200).json({ success: true, data: status });
    }
    catch (error) {
        console.error("🌺 Error consultando estado:", error);
        res
            .status(500)
            .json({ success: false, error: "No se pudo consultar el estado" });
    }
});
//# sourceMappingURL=feriaController.js.map