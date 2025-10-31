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
     * Generate AI image from webcam capture - Complete 3-step pipeline
     */
    async generateImageFromWebcam(request) {
        const requestId = (0, utils_1.generateRequestId)();
        try {
            console.log(`[${requestId}] Starting complete AI pipeline: Logo placement -> Style conversion -> Background removal`);
            // Convert and optimize the image
            const imageBuffer = (0, utils_1.base64ToBuffer)(request.imageData);
            const optimizedBuffer = await (0, utils_1.optimizeImageForAI)(imageBuffer);
            // Upload original image to storage for processing
            const originalImageUrl = await (0, storage_1.uploadToStorage)(optimizedBuffer, "original-images", `original_${requestId}.jpg`);
            // STEP 1: Add logo to the original image using multi-image-kontext-max (DISABLED)
            // console.log(
            //   `[${requestId}] Step 1: Adding logo with multi-image-kontext-max`
            // );
            // const logoImageUrl = await this.processWithMultiImageKontext(
            //   originalImageUrl,
            //   requestId
            // );
            // STEP 2: Convert the logo image to anime style using flux-kontext-pro
            console.log(`[${requestId}] Step 2: Processing with flux-kontext-pro for style conversion`);
            const styledImageUrl = await this.processWithFluxKontextPro(originalImageUrl, // Using original image directly since step 1 is disabled
            request.prompt || "", request.style);
            // STEP 3: Remove background using BiRefNet
            console.log(`[${requestId}] Step 3: Removing background with BiRefNet`);
            const finalImageUrl = await this.processWithBiRefNet(styledImageUrl, requestId);
            console.log(`[${requestId}] Complete AI pipeline finished successfully`);
            const resultFinal = {
                success: true,
                imageUrl: finalImageUrl,
                message: "Image processed successfully through complete pipeline",
                requestId,
                debug: {
                    originalImage: originalImageUrl,
                    step1_logo: "disabled", // Step 1: Logo addition disabled
                    step2_styled: styledImageUrl, // Step 2: Style converted
                    step3_final: finalImageUrl, // Step 3: Background removed
                },
            };
            console.log(`[resultFinal 12121212]`, resultFinal);
            return resultFinal;
        }
        catch (error) {
            console.error(`[${requestId}] AI pipeline failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                requestId,
            };
        }
    }
    /**
     * STEP 1: Process image with flux-kontext-pro for style conversion
     */
    async processWithFluxKontextPro(imageUrl, prompt, style) {
        // flux-kontext-pro parameters - optimizado para estilo cartoon
        const input = {
            prompt: prompt,
            input_image: imageUrl,
            aspect_ratio: "match_input_image", //9:16
            output_format: "png",
            safety_tolerance: 5,
            prompt_upsampling: true, // Activado para mejorar interpretación del prompt
            // seed: 81276873,
        };
        console.log("Processing with flux-kontext-pro optimized for cartoon style:", config_1.REPLICATE_MODELS.FLUX_KONTEXT_PRO.model);
        console.log("Using cartoon illustration prompt:", "anime-style");
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${config_1.REPLICATE_MODELS.FLUX_KONTEXT_PRO.model}`, {
                input,
            });
        }, 3, 2000);
        // flux-kontext-pro returns a FileOutput object with url() method
        if (output && typeof output === "object" && "url" in output) {
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
     * STEP 3: Process image with BiRefNet to remove background.
     */
    async processWithBiRefNet(logoImageUrl, requestId) {
        const input = {
            image: logoImageUrl,
            resolution: "",
        };
        console.log("Processing with BiRefNet for background removal:", config_1.REPLICATE_MODELS.BIREFNET.model);
        console.log("Input image URL:", logoImageUrl);
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${config_1.REPLICATE_MODELS.BIREFNET.model}:${config_1.REPLICATE_MODELS.BIREFNET.version}`, {
                input,
            });
        }, 3, 2000);
        // Handle the output - BiRefNet returns a FileOutput object
        let imageUrl;
        if (output && typeof output === "object" && "url" in output) {
            imageUrl = output.url();
        }
        else if (typeof output === "string") {
            imageUrl = output;
        }
        else if (Array.isArray(output)) {
            imageUrl = output[0];
        }
        else {
            throw new Error("Unexpected output format from BiRefNet API");
        }
        // Download and upload to our storage as final result
        return await this.downloadAndUploadImage(imageUrl, `final_${requestId}`);
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
        // Prompt específico para flux-kontext-pro siguiendo best practices - ESTILO PINTADO
        return "anime-style HD";
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