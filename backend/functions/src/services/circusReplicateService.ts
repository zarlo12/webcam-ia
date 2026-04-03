import Replicate from "replicate";
import { replicateConfig, REPLICATE_MODELS } from "../config";
import { ImageGenerationRequest, ImageGenerationResponse } from "../types";
import {
  generateRequestId,
  base64ToBuffer,
  optimizeImageForAI,
  retryWithBackoff,
} from "../utils";
import { uploadToStorage } from "../utils/storage";

/**
 * Circus-specific Replicate Service
 * Optimized for circus character transformations with identity preservation
 */
class CircusReplicateService {
  private replicate: Replicate | null = null;

  private initReplicate() {
    if (this.replicate) {
      return this.replicate;
    }

    if (!replicateConfig.apiToken) {
      throw new Error("REPLICATE_API_TOKEN environment variable is required");
    }

    this.replicate = new Replicate({
      auth: replicateConfig.apiToken,
    });

    return this.replicate;
  }

  /**
   * Generate circus character transformation from webcam capture
   * Preserves facial identity while applying circus costume/styling
   */
  async generateCircusTransformation(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(
        `[CIRCUS-${requestId}] Starting circus character transformation`,
      );
      console.log(`[CIRCUS-${requestId}] Mode: ${request.style || "unknown"}`);
      console.log(
        `[CIRCUS-${requestId}] Prompt preview: "${request.prompt?.substring(0, 150)}..."`,
      );

      // Upload original image to storage
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeImageForAI(imageBuffer);

      const originalImageUrl = await uploadToStorage(
        optimizedBuffer,
        "circus-originals",
        `circus_original_${requestId}.jpg`,
      );

      console.log(
        `[CIRCUS-${requestId}] Original image uploaded: ${originalImageUrl}`,
      );

      // Process with nano-banana-pro for identity-preserving transformation
      console.log(
        `[CIRCUS-${requestId}] Processing with nano-banana-pro (identity preservation mode)`,
      );

      const finalImageUrl = await this.processCircusTransformation(
        originalImageUrl,
        request.prompt!,
        requestId,
      );

      console.log(
        `[CIRCUS-${requestId}] ✅ Circus transformation completed successfully`,
      );

      return {
        success: true,
        imageUrl: finalImageUrl,
        message:
          "Circus character transformation complete - identity preserved",
        requestId: `circus-${requestId}`,
        debug: {
          originalImage: originalImageUrl,
          finalImage: finalImageUrl,
          mode: request.style,
        },
      };
    } catch (error) {
      console.error(`[CIRCUS-${requestId}] ❌ Transformation failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during circus transformation",
        requestId: `circus-${requestId}`,
      };
    }
  }

  /**
   * Process circus transformation with nano-banana-pro
   * Optimized parameters for facial identity preservation
   */
  private async processCircusTransformation(
    imageUrl: string,
    prompt: string,
    requestId: string,
  ): Promise<string> {
    const input = {
      prompt: prompt,
      resolution: "1K" as const, // High quality for portrait details
      image_input: [imageUrl], // Single image for identity preservation
      aspect_ratio: "9:16" as const, // Vertical format for mobile/totem
      image_search: false, // Don't search for similar images
      google_search: false, // Don't add external references
      output_format: "jpg" as const,
      // Advanced parameters for identity preservation
      guidance_scale: 7.5, // Strong prompt adherence
      num_inference_steps: 50, // More steps for quality
    };

    console.log(`[CIRCUS-${requestId}] 🎭 nano-banana-pro parameters:`, {
      model: REPLICATE_MODELS.NANO_BANANA.model,
      resolution: input.resolution,
      aspectRatio: input.aspect_ratio,
      promptLength: prompt.length,
    });

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${REPLICATE_MODELS.NANO_BANANA.model}` as any,
          { input },
        );
      },
      3, // Max retries
      2000, // Base delay
    );

    // Handle nano-banana output format
    let generatedImageUrl: string;
    if (output && typeof output === "object" && "url" in output) {
      generatedImageUrl = (output as any).url();
    } else if (typeof output === "string") {
      generatedImageUrl = output;
    } else if (Array.isArray(output)) {
      generatedImageUrl = output[0] as string;
    } else {
      throw new Error("Unexpected output format from nano-banana-pro");
    }

    console.log(
      `[CIRCUS-${requestId}] 📥 Downloading generated image from Replicate...`,
    );

    // Download and upload to our Firebase Storage for persistence
    return await this.downloadAndUploadToStorage(
      generatedImageUrl,
      `circus_result_${requestId}`,
    );
  }

  /**
   * Download generated image from Replicate and upload to Firebase Storage
   */
  private async downloadAndUploadToStorage(
    imageUrl: string,
    filename: string,
  ): Promise<string> {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download image from Replicate: ${response.statusText}`,
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      console.log(`📤 Uploading final circus image to Firebase Storage...`);

      return await uploadToStorage(
        buffer,
        "circus-generated",
        `${filename}.jpg`,
      );
    } catch (error) {
      console.error("Failed to download and upload circus image:", error);
      throw new Error("Failed to process generated circus image");
    }
  }

  /**
   * Check processing status (for async operations if needed in future)
   */
  async checkStatus(predictionId: string): Promise<any> {
    try {
      const prediction =
        await this.initReplicate().predictions.get(predictionId);

      return {
        id: predictionId,
        status:
          prediction.status === "succeeded"
            ? "completed"
            : prediction.status === "failed"
              ? "failed"
              : "processing",
        imageUrl: prediction.output
          ? ((Array.isArray(prediction.output)
              ? prediction.output[0]
              : prediction.output) as string)
          : undefined,
        error: prediction.error?.toString(),
        createdAt: new Date(prediction.created_at),
        completedAt: prediction.completed_at
          ? new Date(prediction.completed_at)
          : undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to check circus transformation status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}

export default new CircusReplicateService();
