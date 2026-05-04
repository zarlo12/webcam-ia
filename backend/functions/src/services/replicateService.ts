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
   * Generate AI image from webcam capture - Multi-image composition
   */
  async generateImageFromWebcam(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(
        `[${requestId}] Starting multi-person photo composition with nano-banana-2`,
      );
      console.log(
        `[${requestId}] Processing ${request.images?.length || 1} image(s)`,
      );

      // Upload all images to storage
      const imageUrls: string[] = [];
      const imagesToProcess = request.images || [request.imageData];

      for (let i = 0; i < imagesToProcess.length; i++) {
        const imageBuffer = base64ToBuffer(imagesToProcess[i]);
        const optimizedBuffer = await optimizeImageForAI(imageBuffer);

        const imageUrl = await uploadToStorage(
          optimizedBuffer,
          "original-images",
          `original_${requestId}_${i + 1}.jpg`,
        );

        imageUrls.push(imageUrl);
        console.log(`[${requestId}] Uploaded image ${i + 1}: ${imageUrl}`);
      }

      // Process with nano-banana-2 using all image URLs
      console.log(
        `[${requestId}] Processing with nano-banana-2 for multi-person composition`,
      );
      const prompt = request.prompt || this.getDefaultPrompt(request.style);
      console.log(
        `[${requestId}] Using prompt: "${prompt.substring(0, 100)}..."`,
      );
      const finalImageUrl = await this.processWithNanoBanana(
        imageUrls,
        prompt,
        request.style,
      );

      console.log(
        `[${requestId}] Multi-person photo composition completed successfully`,
      );

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
    } catch (error) {
      console.error(
        `[${requestId}] Multi-person photo composition failed:`,
        error,
      );

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      };
    }
  }

  /**
   * Process image with nano-banana-2 for multi-person photo composition
   */
  private async processWithNanoBanana(
    imageUrls: string[],
    prompt: string,
    style?: string,
  ): Promise<string> {
    // nano-banana-2 parameters - optimized for multi-image composition
    const input = {
      prompt: prompt,
      resolution: "1K" as const,
      image_input: imageUrls, // Array of image URLs
      aspect_ratio: "9:16" as const,
      image_search: false,
      google_search: false,
      output_format: "jpg" as const,
    };

    console.log(
      "Processing with nano-banana-2 for multi-person composition:",
      REPLICATE_MODELS.NANO_BANANA.model,
    );
    console.log(`Using ${imageUrls.length} image(s):`, imageUrls);
    console.log("Using composition prompt:", prompt.substring(0, 200) + "...");

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
      throw new Error("Unexpected output format from nano-banana-2 API");
    }

    // Download and upload to our storage as final result
    const requestId = Date.now().toString();
    return await this.downloadAndUploadImage(
      imageUrl_result,
      `composition_${requestId}`,
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
    // Default prompt for nano-banana-2 multi-person photo composition
    return "Use the first attached image as the base photo containing the person or group of people. This image must remain the original foundation of the final result. Do not recreate, duplicate, replace, or modify the people in this first image. Preserve their faces, body proportions, clothing, expressions, and positions exactly as they appear, keeping them fully recognizable. Do not generate extra copies of them and do not add new people that were not provided.\n\nUse all other attached images (second, third, etc.) only as references for the characters or persons that will be added into the scene. Insert those characters naturally into the environment of the first photo so it looks like everyone was photographed together in the same moment. Place them beside the people from the base image in a natural and friendly way, making sure they do not block faces or alter the original subjects.\n\nCarefully match the camera perspective, angle, depth of field, lighting direction, color temperature, and shadows from the base photo so the added characters blend seamlessly with the scene. Respect realistic scale, distance, and positioning so the composition looks believable and naturally staged.\n\nApply a professional photography style and high-quality photo editing: balanced exposure, improved dynamic range, natural skin tones, subtle color grading, enhanced clarity, realistic shadows, refined contrast, and clean sharpening for a polished look. The result should feel like a professionally taken photograph, with cinematic yet natural lighting, smooth blending, and consistent color tones across all subjects.\n\nVery important: do not modify, duplicate, regenerate, or alter the people from the first image. Only add the characters from the additional attached images into the existing scene.\n\nAvoid distortions, extra limbs, duplicated faces, cloned people, floating objects, text, logos, watermarks, or artificial artifacts.\n\nThe final image should be vertical (aspect ratio 4:5), optimized for mobile viewing and social media stories, with a well-balanced composition, the main subjects centered, natural spacing, and a clean professional finish suitable for sharing on social media.";
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
