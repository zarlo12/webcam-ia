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
   * Generate AI image from webcam capture - Complete 3-step pipeline
   */
  async generateImageFromWebcam(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const requestId = generateRequestId();

    try {
      console.log(
        `[${requestId}] Starting complete AI pipeline: Logo placement -> Style conversion -> Background removal`
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

      // STEP 1: Add logo to the original image using multi-image-kontext-max (DISABLED)
      // console.log(
      //   `[${requestId}] Step 1: Adding logo with multi-image-kontext-max`
      // );
      // const logoImageUrl = await this.processWithMultiImageKontext(
      //   originalImageUrl,
      //   requestId
      // );

      // STEP 2: Convert the logo image to anime style using flux-kontext-pro
      console.log(
        `[${requestId}] Step 2: Processing with flux-kontext-pro for style conversion`
      );
      const styledImageUrl = await this.processWithFluxKontextPro(
        originalImageUrl, // Using original image directly since step 1 is disabled
        request.prompt || "",
        request.style
      );

      // STEP 3: Remove background using BiRefNet
      console.log(`[${requestId}] Step 3: Removing background with BiRefNet`);
      const finalImageUrl = await this.processWithBiRefNet(
        styledImageUrl,
        requestId
      );

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
    } catch (error) {
      console.error(`[${requestId}] AI pipeline failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      };
    }
  }

  /**
   * STEP 1: Process image with flux-kontext-pro for style conversion
   */
  private async processWithFluxKontextPro(
    imageUrl: string,
    prompt: string,
    style?: string
  ): Promise<string> {
    // flux-kontext-pro parameters - optimizado para estilo cartoon
    const input = {
      prompt: prompt,
      input_image: imageUrl,
      aspect_ratio: "match_input_image", //9:16
      output_format: "png" as const,
      safety_tolerance: 5,
      prompt_upsampling: true, // Activado para mejorar interpretación del prompt
      // seed: 81276873,
    };

    console.log(
      "Processing with flux-kontext-pro optimized for cartoon style:",
      REPLICATE_MODELS.FLUX_KONTEXT_PRO.model
    );
    console.log("Using cartoon illustration prompt:", "anime-style");

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
   * STEP 3: Process image with BiRefNet to remove background.
   */
  private async processWithBiRefNet(
    logoImageUrl: string,
    requestId: string
  ): Promise<string> {
    const input = {
      image: logoImageUrl,
      resolution: "",
    };

    console.log(
      "Processing with BiRefNet for background removal:",
      REPLICATE_MODELS.BIREFNET.model
    );
    console.log("Input image URL:", logoImageUrl);

    const output = await retryWithBackoff(
      async () => {
        return await this.initReplicate().run(
          `${REPLICATE_MODELS.BIREFNET.model}:${REPLICATE_MODELS.BIREFNET.version}` as any,
          {
            input,
          }
        );
      },
      3,
      2000
    );

    // Handle the output - BiRefNet returns a FileOutput object
    let imageUrl: string;
    if (output && typeof output === "object" && "url" in output) {
      imageUrl = (output as any).url();
    } else if (typeof output === "string") {
      imageUrl = output;
    } else if (Array.isArray(output)) {
      imageUrl = output[0] as string;
    } else {
      throw new Error("Unexpected output format from BiRefNet API");
    }

    // Download and upload to our storage as final result
    return await this.downloadAndUploadImage(imageUrl, `final_${requestId}`);
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
    // Prompt específico para flux-kontext-pro siguiendo best practices - ESTILO PINTADO
    return "anime-style HD";
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
