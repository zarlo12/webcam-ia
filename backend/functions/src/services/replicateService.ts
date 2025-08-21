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
      console.log(
        `[${requestId}] Starting AI image generation with face-to-many...`
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

    // black-forest-labs/flux-kontext-pro parameters - optimizado para estilo cartoon
    const input = {
      prompt: prompt,
      input_image: imageUrl,
      aspect_ratio: "9:16",
      output_format: "jpg" as const,
      guidance_scale: 7.5, // Aumentado para seguir más estrictamente el prompt
      safety_tolerance: 0,
      prompt_upsampling: true, // Activado para mejorar interpretación del prompt
      num_inference_steps: 35, // Aumentado para mejor calidad cartoon
      seed: 352201709,
      disable_safety_checker: false,
    };

    console.log(
      "Processing with flux-kontext-pro optimized for cartoon style:",
      modelConfig.model
    );
    console.log("Using cartoon illustration prompt:", prompt);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(`${modelConfig.model}` as any, {
          input,
        });
      },
      3,
      2000
    );

    // flux-kontext-pro returns a FileOutput object with url() method
    if (output && typeof output === "object" && "url" in output) {
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
    // Prompt específico para flux-kontext-pro siguiendo best practices - ESTILO PINTADO
    const basePaintedPrompt = `Transform this person into a professional dental practitioner while preserving exactly the same facial features, complexion, and identity. This person is positioned centrally or slightly off-center in a professional portrait style. They wear a light beige or off-white lab coat with a light teal-blue collared shirt underneath. The setting is a warm, inviting dental office with light golden-beige walls, dental chairs, and professional equipment subtly visible in the background. The lighting is warm and diffused, creating soft highlights on their face, with an overall professional yet approachable atmosphere. The style is a semi-realistic painted portrait with visible brushstrokes, reminiscent of impressionistic professional illustration rather than photography. The composition emphasizes the person's face while the background subtly suggests the dental environment. The mood is professional, friendly, and welcoming, with muted warm tones and a painted aesthetic.`;

    switch (style) {
      case ImageStyle.REALISTIC:
        return `${basePaintedPrompt} Make it a detailed painted portrait with realistic brush textures and warm lighting.`;
      case ImageStyle.ARTISTIC:
        return `${basePaintedPrompt} Emphasize the artistic painted style with expressive brushstrokes and warm impressionistic colors.`;
      case ImageStyle.CARTOON:
        return `Transform this person into a friendly dental practitioner while keeping their facial identity. They wear a light beige coat with teal shirt. Painted cartoon style with warm dental office background, approachable and friendly painted aesthetic.`;
      case ImageStyle.PROFESSIONAL:
        return `${basePaintedPrompt} Formal painted executive portrait style with premium dental practice setting and refined brush technique.`;
      case ImageStyle.VINTAGE:
        return `Transform this person into a dental practitioner while preserving their facial features. Classic vintage painted portrait style with warm tones and traditional brushwork in a cozy dental office.`;
      default:
        return basePaintedPrompt;
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
