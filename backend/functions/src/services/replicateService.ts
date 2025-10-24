import Replicate from "replicate";
import { replicateConfig, REPLICATE_MODELS, LOGO_URL } from "../config";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ProcessingStatus,
  ImageStyle,
} from "../types";
import {
  generateRequestId,
  base64ToBuffer,
  optimizeImageForAI,
  retryWithBackoff,
} from "../utils";
import { uploadToStorage } from "../utils/storage";

class ReplicateService {
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
   * Generate AI image from webcam capture - Single step business style conversion
   */
  async generateImageFromWebcam(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(
        `[${requestId}] Starting business style conversion with flux-kontext-pro`
      );

      // Convert and optimize the image
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeImageForAI(imageBuffer);

      // Upload original image to storage for processing
      const originalImageUrl = await uploadToStorage(
        optimizedBuffer,
        "original-images",
        `original_${requestId}.jpg`
      );

      // Single step: Convert to business style using flux-kontext-pro
      console.log(
        `[${requestId}] Processing with flux-kontext-pro for business style conversion`
      );
      const prompt = request.prompt || this.getDefaultPrompt(request.style);
      console.log(`[${requestId}] Using prompt: "${prompt}"`);
      const finalImageUrl = await this.processWithFluxKontextPro(
        originalImageUrl,
        prompt,
        request.style
      );

      console.log(
        `[${requestId}] Business style conversion completed successfully`
      );

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
    } catch (error) {
      console.error(`[${requestId}] Business style conversion failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      };
    }
  }

  /**
   * Process image with flux-kontext-pro for business style conversion
   */
  private async processWithFluxKontextPro(
    imageUrl: string,
    prompt: string,
    style?: string
  ): Promise<string> {
    // flux-kontext-pro parameters - optimized for business style
    const input = {
      seed: 124243038,
      prompt: prompt,
      input_image: imageUrl,
      aspect_ratio: "9:16", //"match_input_image",
      output_format: "jpg" as const,
      safety_tolerance: 2,
      prompt_upsampling: false,
    };

    console.log(
      "Processing with flux-kontext-pro for business style:",
      REPLICATE_MODELS.FLUX_KONTEXT_PRO.model
    );
    console.log("Using business style prompt:", prompt);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${REPLICATE_MODELS.FLUX_KONTEXT_PRO.model}` as any,
          {
            input,
          }
        );
      },
      3,
      2000
    );

    // flux-kontext-pro returns a FileOutput object with url() method
    let imageUrl_result: string;
    if (output && typeof output === "object" && "url" in output) {
      imageUrl_result = (output as any).url();
    } else if (typeof output === "string") {
      imageUrl_result = output;
    } else if (Array.isArray(output)) {
      imageUrl_result = output[0] as string;
    } else {
      throw new Error("Unexpected output format from flux-kontext-pro API");
    }

    // Download and upload to our storage as final result
    const requestId = Date.now().toString();
    return await this.downloadAndUploadImage(
      imageUrl_result,
      `business_${requestId}`
    );
  }

  /**
   * Download generated image and upload to our storage
   */
  private async downloadAndUploadImage(
    imageUrl: string,
    filename: string
  ): Promise<string> {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      return await uploadToStorage(
        buffer,
        "generated-images",
        `${filename}.png`
      );
    } catch (error) {
      console.error("Failed to download and upload image:", error);
      throw new Error("Failed to process generated image");
    }
  }

  /**
   * Get default prompt based on style
   */
  private getDefaultPrompt(style?: string): string {
    // Default business style prompt for flux-kontext-pro
    return "Painting-style person, wearing formal clothes and with a futuristic red background";
  }

  /**
   * Check processing status (for async operations)
   */
  async checkStatus(predictionId: string): Promise<ProcessingStatus> {
    try {
      const prediction = await this.initReplicate().predictions.get(
        predictionId
      );

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
        `Failed to check status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export default new ReplicateService();
