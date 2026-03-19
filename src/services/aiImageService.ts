import axios from "axios";

export interface AIImageRequest {
  imageData: string; // Base64 encoded image
  prompt?: string;
  style?: string;
  userId?: string;
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
  private generateCaricatureUrl: string;
  private healthCheckUrl: string;
  private processingStatusUrl: string;

  constructor() {
    // Use environment variable or fallback to production URLs
    //const baseUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
    const baseUrl = null;
    if (baseUrl) {
      // Development or custom base URL
      this.generateImageUrl = `${baseUrl}/generateAIImage`;
      this.generateCaricatureUrl = `${baseUrl}/generateCaricatureImage`;
      this.healthCheckUrl = `${baseUrl}/healthCheck`;
      this.processingStatusUrl = `${baseUrl}/getProcessingStatus`;
    } else {
      // Production URLs https://generateaiimage-buybcovkna-uc.a.run.app
      this.generateImageUrl = "https://generateaiimage-buybcovkna-uc.a.run.app";
      this.generateCaricatureUrl =
        "https://generatecaricatureimage-buybcovkna-uc.a.run.app";
      this.healthCheckUrl = "https://healthcheck-buybcovkna-uc.a.run.app";
      this.processingStatusUrl =
        "https://getprocessingstatus-buybcovkna-uc.a.run.app";
    }

    console.log("🚀 AIImageService URLs:", {
      generateImageUrl: this.generateImageUrl,
      generateCaricatureUrl: this.generateCaricatureUrl,
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
   * Generate image using FormData (for multipart upload) - Template-based with nano-banana-2
   */
  async generateCaricatureWithTemplate(
    imageBlob: Blob,
    prompt?: string,
    userId?: string,
  ): Promise<AIImageResponse> {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "webcam-image.jpg");

      if (prompt) formData.append("prompt", prompt);
      if (userId) formData.append("userId", userId);

      console.log(
        "Sending image with FormData to Caricature generation service (nano-banana-2 with template)...",
        formData,
      );

      const response = await axios.post(this.generateCaricatureUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 600000, // 10 minutes timeout
      });

      return response.data;
    } catch (error) {
      console.error("Error generating caricature image with template:", error);

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
  ): Promise<AIImageResponse> {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, "webcam-image.jpg");

      if (prompt) formData.append("prompt", prompt);
      if (style) formData.append("style", style);
      if (userId) formData.append("userId", userId);

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
