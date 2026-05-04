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
     * Generate AI image from webcam capture - Multi-image composition
     */
    async generateImageFromWebcam(request) {
        const requestId = (0, utils_1.generateRequestId)();
        try {
            console.log(`[${requestId}] Starting multi-person photo composition with nano-banana-2`);
            console.log(`[${requestId}] Processing ${request.images?.length || 1} image(s)`);
            // Upload all images to storage
            const imageUrls = [];
            const imagesToProcess = request.images || [request.imageData];
            for (let i = 0; i < imagesToProcess.length; i++) {
                const imageBuffer = (0, utils_1.base64ToBuffer)(imagesToProcess[i]);
                const optimizedBuffer = await (0, utils_1.optimizeImageForAI)(imageBuffer);
                const imageUrl = await (0, storage_1.uploadToStorage)(optimizedBuffer, "original-images", `original_${requestId}_${i + 1}.jpg`);
                imageUrls.push(imageUrl);
                console.log(`[${requestId}] Uploaded image ${i + 1}: ${imageUrl}`);
            }
            // Process with nano-banana-2 using all image URLs
            console.log(`[${requestId}] Processing with nano-banana-2 for multi-person composition`);
            const prompt = request.prompt || this.getDefaultPrompt(request.style);
            console.log(`[${requestId}] Using prompt: "${prompt.substring(0, 100)}..."`);
            const finalImageUrl = await this.processWithNanoBanana(imageUrls, prompt, request.style);
            console.log(`[${requestId}] Multi-person photo composition completed successfully`);
            const resultFinal = {
                success: true,
                imageUrl: finalImageUrl,
                message: "Image processed successfully with multi-person composition",
                requestId,
                debug: {
                    originalImages: imageUrls,
                    finalImage: finalImageUrl,
                    imageCount: imageUrls.length,
                },
            };
            console.log(`[resultFinal multi-person composition]`, resultFinal);
            return resultFinal;
        }
        catch (error) {
            console.error(`[${requestId}] Multi-person photo composition failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                requestId,
            };
        }
    }
    /**
     * Process image with nano-banana-2 for multi-person photo composition
     */
    async processWithNanoBanana(imageUrls, prompt, style) {
        // nano-banana-2 parameters - optimized for multi-image composition
        const input = {
            prompt: prompt,
            resolution: "1K",
            image_input: imageUrls, // Array of image URLs
            aspect_ratio: "9:16",
            image_search: false,
            google_search: false,
            output_format: "jpg",
        };
        console.log("Processing with nano-banana-2 for multi-person composition:", config_1.REPLICATE_MODELS.NANO_BANANA.model);
        console.log(`Using ${imageUrls.length} image(s):`, imageUrls);
        console.log("Using composition prompt:", prompt.substring(0, 200) + "...");
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${config_1.REPLICATE_MODELS.NANO_BANANA.model}`, {
                input,
            });
        }, 3, 2000);
        // nano-banana returns a FileOutput object with url() method
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
            throw new Error("Unexpected output format from nano-banana-2 API");
        }
        // Download and upload to our storage as final result
        const requestId = Date.now().toString();
        return await this.downloadAndUploadImage(imageUrl_result, `composition_${requestId}`);
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
        // Default prompt for nano-banana-2 multi-person photo composition
        return "Use the first attached image as the base photo containing the person or group of people. This image must remain the original foundation of the final result. Do not recreate, duplicate, replace, or modify the people in this first image. Preserve their faces, body proportions, clothing, expressions, and positions exactly as they appear, keeping them fully recognizable. Do not generate extra copies of them and do not add new people that were not provided.\n\nUse all other attached images (second, third, etc.) only as references for the characters or persons that will be added into the scene. Insert those characters naturally into the environment of the first photo so it looks like everyone was photographed together in the same moment. Place them beside the people from the base image in a natural and friendly way, making sure they do not block faces or alter the original subjects.\n\nCarefully match the camera perspective, angle, depth of field, lighting direction, color temperature, and shadows from the base photo so the added characters blend seamlessly with the scene. Respect realistic scale, distance, and positioning so the composition looks believable and naturally staged.\n\nApply a professional photography style and high-quality photo editing: balanced exposure, improved dynamic range, natural skin tones, subtle color grading, enhanced clarity, realistic shadows, refined contrast, and clean sharpening for a polished look. The result should feel like a professionally taken photograph, with cinematic yet natural lighting, smooth blending, and consistent color tones across all subjects.\n\nVery important: do not modify, duplicate, regenerate, or alter the people from the first image. Only add the characters from the additional attached images into the existing scene.\n\nAvoid distortions, extra limbs, duplicated faces, cloned people, floating objects, text, logos, watermarks, or artificial artifacts.\n\nThe final image should be vertical (aspect ratio 4:5), optimized for mobile viewing and social media stories, with a well-balanced composition, the main subjects centered, natural spacing, and a clean professional finish suitable for sharing on social media.";
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