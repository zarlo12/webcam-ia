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
            console.log(`[${requestId}] Starting AI image generation...`);
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
        const input = {
            input_image: imageUrl,
            prompt: prompt,
            negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, deformed face, asymmetric face, different person, wrong face",
            num_steps: 50,
            style_strength_ratio: 15,
            num_outputs: 1,
            guidance_scale: 5,
            seed: Math.floor(Math.random() * 1000000),
        };
        console.log("Processing with PhotoMaker model for face preservation:", modelConfig.model);
        console.log("Using prompt with 'img' trigger:", prompt);
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${modelConfig.model}:${modelConfig.version}`, { input });
        }, 3, 2000);
        // Handle different output formats
        if (Array.isArray(output)) {
            return output[0];
        }
        else if (typeof output === "string") {
            return output;
        }
        else if (output && typeof output === "object" && "url" in output) {
            return output.url;
        }
        throw new Error("Unexpected output format from Replicate API");
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
            version: config_1.replicateConfig.version
        };
    }
    /**
     * Get default prompt based on style
     */
    getDefaultPrompt(style) {
        // Base prompt for dental professional portraits that preserves facial identity
        // PhotoMaker requires "img" as trigger word
        const dentalBasePrompt = "a photo of img person as a professional dentist, same face, wearing white medical coat, dental clinic background, clean modern medical office, professional lighting, high quality, detailed, preserve facial features, maintain identity";
        switch (style) {
            case types_1.ImageStyle.REALISTIC:
                return `${dentalBasePrompt}, photorealistic, natural professional lighting, crisp details, same facial structure`;
            case types_1.ImageStyle.ARTISTIC:
                return `${dentalBasePrompt}, artistic professional style, elegant medical portrait, preserve original face`;
            case types_1.ImageStyle.CARTOON:
                return `${dentalBasePrompt}, friendly cartoon style dental professional, approachable smile, keep same person`;
            case types_1.ImageStyle.PROFESSIONAL:
                return `${dentalBasePrompt}, formal business portrait, confident dental professional, stethoscope around neck, same individual`;
            case types_1.ImageStyle.VINTAGE:
                return `${dentalBasePrompt}, classic medical portrait style, timeless professional look, maintain person's identity`;
            default:
                return `${dentalBasePrompt}, confident dental professional with friendly smile, preserve original person`;
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