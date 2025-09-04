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
        // black-forest-labs/flux-kontext-pro parameters - optimizado para estilo cartoon
        const input = {
            prompt: "CARTOON ILLUSTRATION STYLE ONLY - NOT REALISTIC: 2D animated cartoon character illustration, cel-shaded cartoon art style, clean vector-like cartoon illustration. Professional dental cartoon character (face + torso visible), wearing light beige cartoon lab coat and navy/teal cartoon shirt, friendly cartoon smile. Cartoon proportions with slightly oversized cartoon eyes, simplified cartoon features, NO photorealistic details, NO realistic skin texture, NO realistic lighting. Cartoon dental office background with simplified cartoon equipment. Art style: cartoon illustration, corporate cartoon mascot style, 2D animation character design, cartoon advertisement illustration. IMPORTANT: This must look like a cartoon drawing, NOT a photograph or realistic portrait.",
            input_image: imageUrl,
            aspect_ratio: "match_input_image",
            output_format: "jpg",
            guidance_scale: 7.5, // Aumentado para seguir más estrictamente el prompt
            safety_tolerance: 1,
            prompt_upsampling: true, // Activado para mejorar interpretación del prompt
            num_inference_steps: 35, // Aumentado para mejor calidad cartoon
            seed: 2040723876,
            disable_safety_checker: false,
        };
        console.log("Processing with flux-kontext-pro optimized for cartoon style:", modelConfig.model);
        console.log("Using cartoon illustration prompt:", prompt);
        const output = await (0, utils_1.retryWithBackoff)(async () => {
            return await this.initReplicate().run(`${modelConfig.model}`, {
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
        // Prompt específico para flux-kontext-pro siguiendo best practices - ESTILO PINTADO
        const basePaintedPrompt = `Transform this person into a professional dental practitioner while preserving exactly the same facial features, complexion, and identity. This person is positioned centrally or slightly off-center in a professional portrait style. They wear a light beige or off-white lab coat with a light teal-blue collared shirt underneath. The setting is a warm, inviting dental office with light golden-beige walls, dental chairs, and professional equipment subtly visible in the background. The lighting is warm and diffused, creating soft highlights on their face, with an overall professional yet approachable atmosphere. The style is a semi-realistic painted portrait with visible brushstrokes, reminiscent of impressionistic professional illustration rather than photography. The composition emphasizes the person's face while the background subtly suggests the dental environment. The mood is professional, friendly, and welcoming, with muted warm tones and a painted aesthetic.`;
        switch (style) {
            case types_1.ImageStyle.REALISTIC:
                return `${basePaintedPrompt} Make it a detailed painted portrait with realistic brush textures and warm lighting.`;
            case types_1.ImageStyle.ARTISTIC:
                return `${basePaintedPrompt} Emphasize the artistic painted style with expressive brushstrokes and warm impressionistic colors.`;
            case types_1.ImageStyle.CARTOON:
                return `Transform this person into a friendly dental practitioner while keeping their facial identity. They wear a light beige coat with teal shirt. Painted cartoon style with warm dental office background, approachable and friendly painted aesthetic.`;
            case types_1.ImageStyle.PROFESSIONAL:
                return `${basePaintedPrompt} Formal painted executive portrait style with premium dental practice setting and refined brush technique.`;
            case types_1.ImageStyle.VINTAGE:
                return `Transform this person into a dental practitioner while preserving their facial features. Classic vintage painted portrait style with warm tones and traditional brushwork in a cozy dental office.`;
            default:
                return basePaintedPrompt;
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