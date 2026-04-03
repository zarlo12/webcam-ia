"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCircusStatus = exports.circusHealthCheck = exports.generateCircusImage = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const circusReplicateService_1 = __importDefault(require("../services/circusReplicateService"));
/**
 * Parse multipart/form-data for circus image uploads
 */
function parseMultipartData(body, boundary) {
    const fields = {};
    const files = {};
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;
    let pos = body.indexOf(boundaryBuffer, start);
    while (pos !== -1) {
        if (start > 0) {
            parts.push(body.slice(start, pos));
        }
        start = pos + boundaryBuffer.length;
        pos = body.indexOf(boundaryBuffer, start);
    }
    parts.forEach((part) => {
        const headerEnd = part.indexOf("\r\n\r\n");
        if (headerEnd === -1)
            return;
        const headers = part.slice(0, headerEnd).toString();
        let content = part.slice(headerEnd + 4);
        const nameMatch = headers.match(/name="([^"]+)"/);
        if (!nameMatch)
            return;
        const fieldName = nameMatch[1];
        if (headers.includes("filename=")) {
            // It's a file - remove trailing \r\n
            const fileBuffer = content.slice(0, -2);
            files[fieldName] = fileBuffer;
        }
        else {
            // It's a text field - aggressively clean up
            // Remove any trailing \r\n, --, or boundary markers
            let textContent = content.toString();
            // Remove trailing whitespace and control characters
            textContent = textContent.replace(/[\r\n\-]+$/g, "").trim();
            fields[fieldName] = textContent;
        }
    });
    return { fields, files };
}
/**
 * Generate Circus Character Transformation
 * Endpoint: /generateCircusImage
 */
exports.generateCircusImage = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540, // 9 minutes for AI processing
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
}, async (req, res) => {
    try {
        console.log(`\n🎪 ========== CIRCUS TRANSFORMATION REQUEST ==========`);
        console.log(`🎪 Method: ${req.method}`);
        console.log(`🎪 Content-Type: ${req.get("content-type")}`);
        console.log(`🎪 Timestamp: ${new Date().toISOString()}`);
        if (req.method !== "POST") {
            res.status(405).json({
                success: false,
                error: "Method not allowed. Use POST.",
            });
            return;
        }
        // Handle multipart/form-data
        if (req.get("content-type")?.includes("multipart/form-data")) {
            await handleCircusMultipartRequest(req, res);
            return;
        }
        // Handle JSON requests
        if (req.get("content-type")?.includes("application/json")) {
            await handleCircusJsonRequest(req, res);
            return;
        }
        res.status(400).json({
            success: false,
            error: "Unsupported content type. Use multipart/form-data or application/json.",
        });
    }
    catch (error) {
        console.error("🎪 ❌ Error in circus controller:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error during circus transformation",
        });
    }
});
/**
 * Handle multipart/form-data circus requests
 */
const handleCircusMultipartRequest = async (req, res) => {
    try {
        console.log("🎪 📥 Processing circus multipart request");
        const contentType = req.get("content-type") || "";
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) {
            res.status(400).json({
                success: false,
                error: "No boundary found in content-type",
            });
            return;
        }
        const boundary = boundaryMatch[1].replace(/^-+/, "");
        // Get body data
        let body;
        if (req.rawBody) {
            body = Buffer.isBuffer(req.rawBody)
                ? req.rawBody
                : Buffer.from(req.rawBody);
        }
        else if (req.body) {
            body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
        }
        else {
            // Stream reading
            const chunks = [];
            return new Promise((resolve) => {
                req.on("data", (chunk) => chunks.push(chunk));
                req.on("end", async () => {
                    try {
                        const streamBody = Buffer.concat(chunks);
                        await processCircusMultipartBody(streamBody, boundary, res);
                        resolve();
                    }
                    catch (error) {
                        console.error("🎪 ❌ Stream processing error:", error);
                        res.status(400).json({
                            success: false,
                            error: "Failed to process stream data",
                        });
                        resolve();
                    }
                });
                req.on("error", (error) => {
                    console.error("🎪 ❌ Request stream error:", error);
                    res.status(400).json({
                        success: false,
                        error: "Request stream error",
                    });
                    resolve();
                });
            });
        }
        console.log(`🎪 📦 Body size: ${body.length} bytes`);
        await processCircusMultipartBody(body, boundary, res);
    }
    catch (error) {
        console.error("🎪 ❌ Error processing multipart request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process circus image",
        });
    }
};
/**
 * Process circus multipart body
 */
async function processCircusMultipartBody(body, boundary, res) {
    const { fields, files } = parseMultipartData(body, boundary);
    const imageBuffer = files.image;
    if (!imageBuffer) {
        console.error("🎪 ❌ No image file found");
        console.log("Available files:", Object.keys(files));
        console.log("Available fields:", Object.keys(fields));
        res.status(400).json({
            success: false,
            error: "No image file provided. Use 'image' field.",
        });
        return;
    }
    console.log(`🎪 ✅ Image received: ${imageBuffer.length} bytes`);
    const prompt = fields.prompt || "";
    const style = fields.style || "";
    const userId = fields.userId || "";
    const model = fields.model || "google/nano-banana-pro"; // Default to nano-banana-pro
    console.log(`🎪 📋 Parameters:`);
    console.log(`   - Model: "${model}"`);
    console.log(`   - Style/Mode: "${style}"`);
    console.log(`   - User ID: "${userId}"`);
    console.log(`   - Prompt length: ${prompt.length} chars`);
    console.log(`   - Prompt preview: "${prompt.substring(0, 200)}..."`);
    if (!prompt || prompt.length < 50) {
        res.status(400).json({
            success: false,
            error: "Prompt is required and must be detailed (min 50 characters)",
        });
        return;
    }
    // Detect mime type
    let mimeType = "image/jpeg";
    if (imageBuffer
        .slice(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        mimeType = "image/png";
    }
    const base64Image = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const request = {
        imageData: base64Image,
        prompt,
        style,
        userId,
        model,
    };
    console.log(`🎪 🤖 Sending to Circus Replicate Service...`);
    const result = await circusReplicateService_1.default.generateCircusTransformation(request);
    console.log(`🎪 ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`🎪 ========== END CIRCUS TRANSFORMATION ==========\n`);
    res.status(result.success ? 200 : 400).json(result);
}
/**
 * Handle JSON circus requests
 */
const handleCircusJsonRequest = async (req, res) => {
    const { imageData, prompt, style, userId, model } = req.body;
    if (!imageData) {
        res.status(400).json({
            success: false,
            error: "imageData is required",
        });
        return;
    }
    if (!imageData.startsWith("data:image/")) {
        res.status(400).json({
            success: false,
            error: "Invalid image format. Must be base64 encoded image.",
        });
        return;
    }
    if (!prompt || prompt.length < 50) {
        res.status(400).json({
            success: false,
            error: "Prompt is required and must be detailed",
        });
        return;
    }
    console.log(`🎪 Processing JSON circus request`);
    console.log(`   - Model: ${model || "google/nano-banana-pro (default)"}`);
    console.log(`   - Style: ${style}`);
    console.log(`   - Prompt length: ${prompt.length}`);
    const request = {
        imageData,
        prompt,
        style,
        userId,
        model,
    };
    const result = await circusReplicateService_1.default.generateCircusTransformation(request);
    res.status(result.success ? 200 : 400).json(result);
};
/**
 * Circus Health Check
 * Endpoint: /circusHealthCheck
 */
exports.circusHealthCheck = v2_1.https.onRequest({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "us-central1",
}, async (req, res) => {
    res.status(200).json({
        success: true,
        service: "Circus AI Image Generation",
        message: "🎪 Circus transformation service is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        features: [
            "Identity-preserving transformations",
            "10 circus character styles",
            "Modo Terror (5 styles)",
            "Modo Clásico (5 styles)",
            "Premium cinematic quality",
            "9:16 vertical format",
        ],
    });
});
/**
 * Get Circus Processing Status
 * Endpoint: /getCircusStatus
 */
exports.getCircusStatus = v2_1.https.onRequest({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1",
}, async (req, res) => {
    try {
        const predictionId = req.query.predictionId;
        if (!predictionId) {
            res.status(400).json({
                success: false,
                error: "predictionId is required",
            });
            return;
        }
        const status = await circusReplicateService_1.default.checkStatus(predictionId);
        res.status(200).json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        console.error("🎪 Error getting circus status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get circus processing status",
        });
    }
});
//# sourceMappingURL=circusController.js.map