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
      console.log(`[${requestId}] Starting AI image generation...`);

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

    const input = {
      input_image: imageUrl,
      prompt: prompt,
      negative_prompt:
        "blurry, low quality, distorted, ugly, bad anatomy, deformed face, asymmetric face, different person, wrong face, face swap, face change, altered face, modified facial features, different eyes, different nose, different mouth, changed skin, facial reconstruction",
      num_steps: 20,
      style_strength_ratio: 5,
      num_outputs: 1,
      guidance_scale: 15,
      seed: Math.floor(Math.random() * 1000000),
    };

    console.log(
      "Processing with PhotoMaker model for face preservation:",
      modelConfig.model
    );
    console.log("Using prompt with 'img' trigger:", prompt);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${modelConfig.model}:${modelConfig.version}` as any,
          { input }
        );
      },
      3,
      2000
    );

    // Handle different output formats
    if (Array.isArray(output)) {
      return output[0] as string;
    } else if (typeof output === "string") {
      return output;
    } else if (output && typeof output === "object" && "url" in output) {
      return (output as any).url;
    }

    throw new Error("Unexpected output format from Replicate API");
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
    // Ultra-conservative prompt for maximum face preservation
    // PhotoMaker requires "img" as trigger word - MAXIMUM face preservation
    const dentalBasePrompt =
      "a photo of img person wearing white medical coat in dental clinic, DO NOT CHANGE FACE, keep exact same face, preserve all facial features 100%, same eyes same nose same mouth, identical person, no facial modifications whatsoever";

    switch (style) {
      case ImageStyle.REALISTIC:
        return `${dentalBasePrompt}, realistic medical setting, same face exactly, no changes to facial features`;
      case ImageStyle.ARTISTIC:
        return `${dentalBasePrompt}, professional medical portrait, preserve face completely, same person`;
      case ImageStyle.CARTOON:
        return `${dentalBasePrompt}, cartoon style but keep identical face, same facial features`;
      case ImageStyle.PROFESSIONAL:
        return `${dentalBasePrompt}, business portrait, stethoscope, exact same face, zero facial changes`;
      case ImageStyle.VINTAGE:
        return `${dentalBasePrompt}, classic style, maintain identical facial features, same person`;
      default:
        return `${dentalBasePrompt}, professional dentist outfit only, keep face 100% identical, no facial changes`;
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
