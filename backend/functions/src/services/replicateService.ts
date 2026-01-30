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
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(
        `[${requestId}] Starting 3D caricature conversion with nano-banana`,
      );

      // Convert and optimize the image
      const imageBuffer = base64ToBuffer(request.imageData);
      const optimizedBuffer = await optimizeImageForAI(imageBuffer);

      // Upload original image to storage for processing
      const originalImageUrl = await uploadToStorage(
        optimizedBuffer,
        "original-images",
        `original_${requestId}.jpg`,
      );

      // Single step: Convert to 3D caricature style using nano-banana
      console.log(
        `[${requestId}] Processing with nano-banana for 3D caricature conversion`,
      );
      const prompt = request.prompt || this.getDefaultPrompt(request.style);
      console.log(`[${requestId}] Using prompt: "${prompt}"`);
      const finalImageUrl = await this.processWithNanoBanana(
        originalImageUrl,
        prompt,
        request.style,
      );

      console.log(
        `[${requestId}] 3D caricature conversion completed successfully`,
      );

      const resultFinal = {
        success: true,
        imageUrl: finalImageUrl,
        message: "Image processed successfully with 3D caricature style",
        requestId,
        debug: {
          originalImage: originalImageUrl,
          finalImage: finalImageUrl,
        },
      };

      console.log(`[resultFinal 3D caricature]`, resultFinal);
      return resultFinal;
    } catch (error) {
      console.error(`[${requestId}] 3D caricature conversion failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      };
    }
  }

  /**
   * Process image with nano-banana for 3D caricature conversion
   */
  private async processWithNanoBanana(
    imageUrl: string,
    prompt: string,
    style?: string,
  ): Promise<string> {
    // nano-banana parameters - optimized for 3D caricature style
    const input = {
      prompt: prompt,
      image_input: [imageUrl],
      aspect_ratio: "3:4",
      output_format: "jpg" as const,
    };

    console.log(
      "Processing with nano-banana for 3D caricature:",
      REPLICATE_MODELS.NANO_BANANA.model,
    );
    console.log("Using 3D caricature prompt:", prompt);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${REPLICATE_MODELS.NANO_BANANA.model}` as any,
          {
            input,
          },
        );
      },
      3,
      2000,
    );

    // nano-banana returns a FileOutput object with url() method
    let imageUrl_result: string;
    if (output && typeof output === "object" && "url" in output) {
      imageUrl_result = (output as any).url();
    } else if (typeof output === "string") {
      imageUrl_result = output;
    } else if (Array.isArray(output)) {
      imageUrl_result = output[0] as string;
    } else {
      throw new Error("Unexpected output format from nano-banana API");
    }

    // Download and upload to our storage as final result
    const requestId = Date.now().toString();
    return await this.downloadAndUploadImage(
      imageUrl_result,
      `caricature_${requestId}`,
    );
  }

  /**
   * Download generated image and upload to our storage
   */
  private async downloadAndUploadImage(
    imageUrl: string,
    filename: string,
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
        `${filename}.png`,
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
    // Default 3D caricature prompt for nano-banana
    return 'Transform the uploaded photo into a high-quality 3D caricature style portrait with exaggerated but recognizable facial features.\n\nThe person must clearly remain the same individual: preserve exact facial structure, eye shape, nose, mouth, skin tone, hairline, and expression identity from the original photo. Do NOT change gender, age, or facial proportions beyond stylized exaggeration.\n\nStyle details:\n\nSemi-realistic 3D caricature, big expressive eyes, slightly enlarged head, smooth skin, detailed facial shading\n\nHighly expressive, joyful facial expression, wide smile, energetic pose\n\nClothing:\n\nRed soccer jersey with yellow and blue trim on the collar and sleeves\n\nWhite "Claro" logo centered on the chest\n\nJersey fit and fabric texture similar to a professional football uniform\n\nPose:\n\nUpper body visible\n\nBoth fists clenched in front of the chest in a celebratory pose\n\nBackground:\n\nStadium environment with blurred crowd\n\nWarm cinematic lighting\n\nFloating confetti and particles in the air\n\nDepth of field with strong subject focus\n\nLighting & quality:\n\nDramatic stadium lights\n\nHigh contrast, vibrant colors\n\nUltra high resolution, sharp focus, professional render\n\nImportant constraints:\n\nDo NOT replace the face with another person\n\nDo NOT alter facial identity\n\nKeep the same character style, jersey, and background for every transformation';
  }

  /**
   * Check processing status (for async operations)
   */
  async checkStatus(predictionId: string): Promise<ProcessingStatus> {
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
        `Failed to check status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}

export default new ReplicateService();
