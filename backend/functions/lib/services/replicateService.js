"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
const config_1 = require("../config");
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
     * Generate AI image from webcam capture - Single step business style conversion
     */
    async generateImageFromWebcam(request) {
        const requestId = (0, utils_1.generateRequestId)();
        try {
            console.log(`[${requestId}] Starting business style conversion with flux-kontext-pro`);
            // Convert and optimize the image
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await (0, utils_1.optimizeImageForAI)(imageBuffer);
            // Upload original image to storage for processing
            const originalImageUrl = await (0, storage_1.uploadToStorage)(optimizedBuffer, "original-images", `original_${requestId}.jpg`);
            // Single step: Convert to business style using flux-kontext-pro
            console.log(`[${requestId}] Processing with flux-kontext-pro for business style conversion`);
            const finalImageUrl = await this.processWithFluxKontextPro(originalImageUrl, "Painting-style person, wearing formal clothes and with a futuristic red background", request.style);
            console.log(`[${requestId}] Business style conversion completed successfully`);
            const resultFinal = {
                success: true,
                imageUrl: finalImageUrl,
                message: "Image processed successfully with business style",
                requestId,
                debug: {
                    originalImage: originalImageUrl,
                    finalImage: finalImageUrl,
                },
            };
            console.log(`[resultFinal business style]`, resultFinal);
            return resultFinal;
        }
        catch (error) {
            console.error(`[${requestId}] Business style conversion failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                requestId,
            };
        }
    }
    /**
     * Process image with flux-kontext-pro for business style conversion
     */
    async processWithFluxKontextPro(imageUrl, prompt, style) {
        // flux-kontext-pro parameters - optimized for business style
        const input = {
            seed: 725753180,
            prompt: prompt,
            input_image: imageUrl,
            aspect_ratio: "match_input_image",
            output_format: "jpg",
            safety_tolerance: 2,
            prompt_upsampling: true,
        };
        console.log("Processing with flux-kontext-pro for business style:", config_1.REPLICATE_MODELS.FLUX_KONTEXT_PRO.model);
        console.log("Using business style prompt:", prompt);
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${config_1.REPLICATE_MODELS.FLUX_KONTEXT_PRO.model}`, {
                input,
            });
        }, 3, 2000);
        // flux-kontext-pro returns a FileOutput object with url() method
        let imageUrl_result;
        if (output && typeof output === "object" && "url" in output) {
            imageUrl_result = output.url();
        }
        else if (typeof output === "string") {
            imageUrl_result = output;
        }
        else if (Array.isArray(output)) {
            imageUrl_result = output[0];
        }
        else {
            throw new Error("Unexpected output format from flux-kontext-pro API");
        }
        // Download and upload to our storage as final result
        const requestId = Date.now().toString();
        return await this.downloadAndUploadImage(imageUrl_result, `business_${requestId}`);
    }
    /**
     * Download generated image and upload to our storage
     */
    async downloadAndUploadImage(imageUrl, filename) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            return await (0, storage_1.uploadToStorage)(buffer, "generated-images", `${filename}.png`);
        }
        catch (error) {
            console.error("Failed to download and upload image:", error);
            throw new Error("Failed to process generated image");
        }
    }
    /**
     * Get default prompt based on style
     */
    getDefaultPrompt(style) {
        // Business style prompt for flux-kontext-pro
        return "Painting-style person, wearing formal clothes and with a futuristic red background";
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