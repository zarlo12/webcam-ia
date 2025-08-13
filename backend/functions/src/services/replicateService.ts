import Replicate from "replicate";
import { replicateConfig, REPLICATE_MODELS } from "../config";
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
   * Generate AI image from webcam capture
   */
  async generateImageFromWebcam(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(`[${requestId}] Starting AI image generation with face-to-many...`);

      // Convert and optimize the image
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeImageForAI(imageBuffer);

      // Upload original image to storage for processing
      const originalImageUrl = await uploadToStorage(
        optimizedBuffer,
        "original-images",
        `original_${requestId}.jpg`
      );

      // Generate the AI image using Replicate
      const generatedImageUrl = await this.processWithReplicate(
        originalImageUrl,
        request.prompt || this.getDefaultPrompt(request.style),
        request.style
      );

      // Upload generated image to our storage
      const finalImageUrl = await this.downloadAndUploadImage(
        generatedImageUrl,
        requestId
      );

      console.log(`[${requestId}] AI image generation completed successfully`);

      return {
        success: true,
        imageUrl: finalImageUrl,
        message: "Image generated successfully",
        requestId,
      };
    } catch (error) {
      console.error(`[${requestId}] AI image generation failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      };
    }
  }

  /**
   * Process image with Replicate API
   */
  private async processWithReplicate(
    imageUrl: string,
    prompt: string,
    style?: string
  ): Promise<string> {
    const modelConfig = this.getModelConfig(style);

    // black-forest-labs/flux-kontext-pro parameters - modelo PRO para máximo realismo
    const input = {
      prompt: prompt,
      input_image: imageUrl,
      output_format: "jpg" as const,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      seed: Math.floor(Math.random() * 1000000),
      disable_safety_checker: false
    };

    console.log(
      "Processing with flux-kontext-pro for ultra-realistic results:",
      modelConfig.model
    );
    console.log("Using detailed realistic dental prompt:", prompt);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${modelConfig.model}` as any,
          { input }
        );
      },
      3,
      2000
    );

    // flux-kontext-pro returns a FileOutput object with url() method
    if (output && typeof output === 'object' && 'url' in output) {
      return (output as any).url();
    } else if (typeof output === "string") {
      return output;
    } else if (Array.isArray(output)) {
      return output[0] as string;
    }

    throw new Error("Unexpected output format from flux-kontext-pro API");
  }

  /**
   * Download generated image and upload to our storage
   */
  private async downloadAndUploadImage(
    imageUrl: string,
    requestId: string
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
        `generated_${requestId}.jpg`
      );
    } catch (error) {
      console.error("Failed to download and upload image:", error);
      throw new Error("Failed to process generated image");
    }
  }

  /**
   * Get model configuration based on style
   */
  private getModelConfig(style?: string) {
    // Always use PhotoMaker for face preservation
    return {
      model: replicateConfig.model,
      version: replicateConfig.version,
    };
  }

  /**
   * Get default prompt based on style
   */
  private getDefaultPrompt(style?: string): string {
    // Prompt específico para flux-kontext-pro siguiendo best practices
    const baseRealisticPrompt = `Transform this person into a professional dentist while keeping the same facial features and identity. They are wearing a clean white medical coat and have a stethoscope around their neck. The background is a modern, bright dental clinic with a dental chair, medical equipment on trays, diplomas on the wall, and professional medical lighting. The style is ultra-realistic medical photography with natural skin texture and high detail.`;

    switch (style) {
      case ImageStyle.REALISTIC:
        return `${baseRealisticPrompt} Make it photorealistic with perfect lighting and clinical atmosphere.`;
      case ImageStyle.ARTISTIC:
        return `Transform this person into a professional dentist while maintaining their exact facial features. They wear a white medical coat in an elegant dental office. Artistic professional medical portrait style.`;
      case ImageStyle.CARTOON:
        return `Transform this person into a friendly dentist character while keeping their facial identity. They wear a white medical coat. Cartoon dental office background, warm and approachable style.`;
      case ImageStyle.PROFESSIONAL:
        return `${baseRealisticPrompt} Formal executive medical portrait style with premium dental practice setting.`;
      case ImageStyle.VINTAGE:
        return `Transform this person into a dentist while preserving their facial features. Classic vintage medical photography style in a traditional dental office.`;
      default:
        return baseRealisticPrompt;
    }
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
