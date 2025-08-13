"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
const config_1 = require("../config");
const types_1 = require("../types");
const utils_1 = require("../utils");
const storage_1 = require("../utils/storage");
class ReplicateService {
    replicate = null;
    initReplicate() {
        if (this.replicate) {
            return this.replicate;
        }
        if (!config_1.replicateConfig.apiToken) {
            throw new Error("REPLICATE_API_TOKEN environment variable is required");
        }
        this.replicate = new replicate_1.default({
            auth: config_1.replicateConfig.apiToken,
        });
        return this.replicate;
    }
    /**
     * Generate AI image from webcam capture
     */
    async generateImageFromWebcam(request) {
        const requestId = (0, utils_1.generateRequestId)();
        try {
            console.log(`[${requestId}] Starting AI image generation with face-to-many...`);
            // Convert and optimize the image
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await (0, utils_1.optimizeImageForAI)(imageBuffer);
            // Upload original image to storage for processing
            const originalImageUrl = await (0, storage_1.uploadToStorage)(optimizedBuffer, "original-images", `original_${requestId}.jpg`);
            // Generate the AI image using Replicate
            const generatedImageUrl = await this.processWithReplicate(originalImageUrl, request.prompt || this.getDefaultPrompt(request.style), request.style);
            // Upload generated image to our storage
            const finalImageUrl = await this.downloadAndUploadImage(generatedImageUrl, requestId);
            console.log(`[${requestId}] AI image generation completed successfully`);
            return {
                success: true,
                imageUrl: finalImageUrl,
                message: "Image generated successfully",
                requestId,
            };
        }
        catch (error) {
            console.error(`[${requestId}] AI image generation failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                requestId,
            };
        }
    }
    /**
     * Process image with Replicate API
     */
    async processWithReplicate(imageUrl, prompt, style) {
        const modelConfig = this.getModelConfig(style);
        // black-forest-labs/flux-kontext-pro parameters - modelo PRO para máximo realismo
        const input = {
            prompt: prompt,
            input_image: imageUrl,
            output_format: "jpg",
            guidance_scale: 3.5,
            num_inference_steps: 28,
            seed: Math.floor(Math.random() * 1000000),
            disable_safety_checker: false
        };
        console.log("Processing with flux-kontext-pro for ultra-realistic results:", modelConfig.model);
        console.log("Using detailed realistic dental prompt:", prompt);
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${modelConfig.model}`, { input });
        }, 3, 2000);
        // flux-kontext-pro returns a FileOutput object with url() method
        if (output && typeof output === 'object' && 'url' in output) {
            return output.url();
        }
        else if (typeof output === "string") {
            return output;
        }
        else if (Array.isArray(output)) {
            return output[0];
        }
        throw new Error("Unexpected output format from flux-kontext-pro API");
    }
    /**
     * Download generated image and upload to our storage
     */
    async downloadAndUploadImage(imageUrl, requestId) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            return await (0, storage_1.uploadToStorage)(buffer, "generated-images", `generated_${requestId}.jpg`);
        }
        catch (error) {
            console.error("Failed to download and upload image:", error);
            throw new Error("Failed to process generated image");
        }
    }
    /**
     * Get model configuration based on style
     */
    getModelConfig(style) {
        // Always use PhotoMaker for face preservation
        return {
            model: config_1.replicateConfig.model,
            version: config_1.replicateConfig.version,
        };
    }
    /**
     * Get default prompt based on style
     */
    getDefaultPrompt(style) {
        // Prompt específico para flux-kontext-pro siguiendo best practices
        const baseRealisticPrompt = `Transform this person into a professional dentist while keeping the same facial features and identity. They are wearing a clean white medical coat and have a stethoscope around their neck. The background is a modern, bright dental clinic with a dental chair, medical equipment on trays, diplomas on the wall, and professional medical lighting. The style is ultra-realistic medical photography with natural skin texture and high detail.`;
        switch (style) {
            case types_1.ImageStyle.REALISTIC:
                return `${baseRealisticPrompt} Make it photorealistic with perfect lighting and clinical atmosphere.`;
            case types_1.ImageStyle.ARTISTIC:
                return `Transform this person into a professional dentist while maintaining their exact facial features. They wear a white medical coat in an elegant dental office. Artistic professional medical portrait style.`;
            case types_1.ImageStyle.CARTOON:
                return `Transform this person into a friendly dentist character while keeping their facial identity. They wear a white medical coat. Cartoon dental office background, warm and approachable style.`;
            case types_1.ImageStyle.PROFESSIONAL:
                return `${baseRealisticPrompt} Formal executive medical portrait style with premium dental practice setting.`;
            case types_1.ImageStyle.VINTAGE:
                return `Transform this person into a dentist while preserving their facial features. Classic vintage medical photography style in a traditional dental office.`;
            default:
                return baseRealisticPrompt;
        }
    }
    /**
     * Check processing status (for async operations)
     */
    async checkStatus(predictionId) {
        try {
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
        catch (error) {
            throw new Error(`Failed to check status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.default = new ReplicateService();
//# sourceMappingURL=replicateService.js.map