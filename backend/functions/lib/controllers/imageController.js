"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getProcessingStatus = exports.generateAIImage = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const replicateService_1 = __importDefault(require("../services/replicateService"));
// Simple multipart parser for Firebase Functions
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
        const content = part.slice(headerEnd + 4);
        const nameMatch = headers.match(/name="([^"]+)"/);
        if (!nameMatch)
            return;
        const fieldName = nameMatch[1];
        if (headers.includes("filename=")) {
            // It's a file
            files[fieldName] = content.slice(0, -2); // Remove trailing \r\n
        }
        else {
            // It's a text field
            fields[fieldName] = content.toString().trim();
        }
    });
    return { fields, files };
}
exports.generateAIImage = (0, https_1.onRequest)({
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
}, async (req, res) => {
    try {
        console.log(`📥 ${req.method} request received - using custom parser v4`);
        if (req.method !== "POST") {
            res.status(405).json({
                success: false,
                error: "Method not allowed. Use POST.",
            });
            return;
        }
        // Handle multipart/form-data with custom parser
        if (req.get("content-type")?.includes("multipart/form-data")) {
            await handleMultipartRequest(req, res);
            return;
        }
        // Handle JSON requests
        if (req.get("content-type")?.includes("application/json")) {
            await handleJsonRequest(req, res);
            return;
        }
        res.status(400).json({
            success: false,
            error: "Unsupported content type. Use multipart/form-data or application/json.",
        });
    }
    catch (error) {
        console.error("❌ Error in generateAIImage controller:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
/**
 * Handle multipart/form-data requests using custom parser
 */
const handleMultipartRequest = async (req, res) => {
    try {
        console.log("📥 Processing multipart request with custom parser v2");
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
        console.log(`🔍 Boundary: ${boundary}`);
        // Get body data - try different ways to access it
        let body;
        if (req.rawBody) {
            console.log("📦 Using req.rawBody");
            body = Buffer.isBuffer(req.rawBody)
                ? req.rawBody
                : Buffer.from(req.rawBody);
        }
        else if (req.body) {
            console.log("📦 Using req.body");
            body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
        }
        else {
            console.log("📦 Reading from stream...");
            // Fallback to stream reading
            const chunks = [];
            return new Promise((resolve) => {
                req.on("data", (chunk) => {
                    chunks.push(chunk);
                    console.log(`📦 Chunk: ${chunk.length} bytes`);
                });
                req.on("end", async () => {
                    try {
                        const streamBody = Buffer.concat(chunks);
                        await processMultipartBody(streamBody, boundary, res);
                        resolve();
                    }
                    catch (error) {
                        console.error("❌ Stream processing error:", error);
                        res.status(400).json({
                            success: false,
                            error: "Failed to process stream data",
                        });
                        resolve();
                    }
                });
                req.on("error", (error) => {
                    console.error("❌ Request stream error:", error);
                    res.status(400).json({
                        success: false,
                        error: "Request stream error",
                    });
                    resolve();
                });
            });
        }
        console.log(`📦 Body size: ${body.length} bytes`);
        await processMultipartBody(body, boundary, res);
    }
    catch (error) {
        console.error("❌ Error processing multipart request:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process image",
        });
    }
};
async function processMultipartBody(body, boundary, res) {
    const { fields, files } = parseMultipartData(body, boundary);
    if (!files.image) {
        console.error("❌ No image file found");
        console.log("Available files:", Object.keys(files));
        console.log("Available fields:", Object.keys(fields));
        res.status(400).json({
            success: false,
            error: "No image file provided",
        });
        return;
    }
    const imageBuffer = files.image;
    const prompt = fields.prompt || "";
    const style = fields.style || "";
    const userId = fields.userId || "";
    console.log(`✅ Image received: ${imageBuffer.length} bytes`);
    console.log(`📋 Parameters: prompt="${prompt}", style="${style}", userId="${userId}"`);
    // Convert buffer to base64 - detect image type from buffer
    let mimeType = "image/jpeg"; // default
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
    };
    console.log("🤖 Sending to Replicate AI...");
    const result = await replicateService_1.default.generateImageFromWebcam(request);
    res.status(result.success ? 200 : 400).json(result);
}
/**
 * Handle JSON requests
 */
const handleJsonRequest = async (req, res) => {
    const { imageData, prompt, style, userId } = req.body;
    if (!imageData) {
        res.status(400).json({
            success: false,
            error: "imageData is required",
        });
        return;
    }
    // Validate base64 image format
    if (!imageData.startsWith("data:image/")) {
        res.status(400).json({
            success: false,
            error: "Invalid image format. Must be base64 encoded image.",
        });
        return;
    }
    const request = {
        imageData,
        prompt,
        style,
        userId,
    };
    const result = await replicateService_1.default.generateImageFromWebcam(request);
    res.status(result.success ? 200 : 400).json(result);
};
/**
 * Get processing status for async operations
 */
exports.getProcessingStatus = v2_1.https.onRequest({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
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
        const status = await replicateService_1.default.checkStatus(predictionId);
        res.status(200).json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        console.error("Error getting processing status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get processing status",
        });
    }
});
/**
 * Health check endpoint
 */
exports.healthCheck = v2_1.https.onRequest({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
}, async (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Image Generation Service is running",
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=imageController.js.map