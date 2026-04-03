import axios from "axios";

export interface AIImageRequest {
  imageData: string; // Base64 encoded image
  prompt?: string;
  style?: string;
  userId?: string;
  model?: string; // Replicate model to use (e.g., "google/nano-banana-pro" or "google/nano-banana")
}

export interface AIImageResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
}

export enum ImageStyle {
  REALISTIC = "realistic",
  ARTISTIC = "artistic",
  CARTOON = "cartoon",
  PROFESSIONAL = "professional",
  VINTAGE = "vintage",
}

class AIImageService {
  private generateImageUrl: string;
  private healthCheckUrl: string;
  private processingStatusUrl: string;

  constructor() {
    // Use environment variable or fallback to production URLs
    //const baseUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
    const baseUrl = null;
    if (baseUrl) {
      // Development or custom base URL
      this.generateImageUrl = `${baseUrl}/generateCircusImage`;
      this.healthCheckUrl = `${baseUrl}/circusHealthCheck`;
      this.processingStatusUrl = `${baseUrl}/getCircusStatus`;
    } else {
      // Production URLs - CIRCUS PROJECT SPECIFIC
      // TODO: After deploying, update these URLs with your actual Firebase Functions URLs
      // Deploy with: cd backend/functions && npm run deploy
      // Then update these URLs from the deployment output
      this.generateImageUrl =
        "https://generatecircusimage-buybcovkna-uc.a.run.app";
      this.healthCheckUrl = "https://circushealthcheck-buybcovkna-uc.a.run.app";
      this.processingStatusUrl =
        "https://getcircusstatus-buybcovkna-uc.a.run.app";
    }

    console.log("🎪 Circus AI Service URLs:", {
      generateImageUrl: this.generateImageUrl,
      healthCheckUrl: this.healthCheckUrl,
      processingStatusUrl: this.processingStatusUrl,
    });
  }

  /**
   * Generate AI image from webcam capture
   */
  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    try {
      console.log("Sending image to AI generation service...");

      const response = await axios.post(this.generateImageUrl, request, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 600000, // 10 minutes timeout for AI processing
      });

      return response.data;
    } catch (error) {
      console.error("Error generating AI image:", error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Network error occurred",
        };
      }

      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Generate image using FormData (for multipart upload)
   */
  async generateImageWithFormData(
    imageBlob: Blob,
    prompt?: string,
    style?: string,
    userId?: string,
    model?: string,
  ): Promise<AIImageResponse> {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "webcam-image.jpg");

      if (prompt) formData.append("prompt", prompt);
      if (style) formData.append("style", style);
      if (userId) formData.append("userId", userId);
      if (model) formData.append("model", model);

      console.log(
        "Sending image with FormData to AI generation service...",
        formData,
      );

      const response = await axios.post(this.generateImageUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error("Error generating AI image with FormData:", error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Network error occurred",
        };
      }

      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Generate image with multiple reference images (for multi-person composition)
   * First image is the user's photo, rest are reference images of characters/celebrities
   */
  async generateImageWithMultipleImages(
    userImageBlob: Blob,
    referenceImageBlobs: Blob[],
    prompt?: string,
    style?: string,
    userId?: string,
  ): Promise<AIImageResponse> {
    try {
      const formData = new FormData();

      // Add user's photo as the first image
      formData.append("image1", userImageBlob, "user-photo.jpg");

      // Add reference images
      referenceImageBlobs.forEach((blob, index) => {
        formData.append(
          `image${index + 2}`,
          blob,
          `reference-${index + 1}.jpg`,
        );
      });

      if (prompt) formData.append("prompt", prompt);
      if (style) formData.append("style", style);
      if (userId) formData.append("userId", userId);

      console.log(
        `📤 Sending ${1 + referenceImageBlobs.length} image(s) to AI service...`,
        {
          userImage: "1 image",
          referenceImages: `${referenceImageBlobs.length} images`,
          prompt: prompt?.substring(0, 100) + "...",
        },
      );

      const response = await axios.post(this.generateImageUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error(
        "❌ Error generating AI image with multiple images:",
        error,
      );

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Network error occurred",
        };
      }

      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(this.healthCheckUrl, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        success: false,
        error: "Service unavailable",
      };
    }
  }

  /**
   * Get processing status (for async operations)
   */
  async getProcessingStatus(predictionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.processingStatusUrl}?predictionId=${predictionId}`,
        { timeout: 10000 },
      );
      return response.data;
    } catch (error) {
      console.error("Error getting processing status:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw new Error("Failed to get processing status");
    }
  }
}

export default new AIImageService();
