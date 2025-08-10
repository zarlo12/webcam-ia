import { https } from "firebase-functions/v2";
import { replicateService } from "../services";
import { ImageGenerationRequest } from "../types";
import { base64ToBuffer } from "../utils";

/**
 * Controller for handling AI image generation from webcam capture
 */
export const generateAIImage = https.onRequest(
  {
    cors: true,
    maxInstances: 5,
    timeoutSeconds: 540,
    memory: "2GiB",
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          error: "Method not allowed. Use POST.",
        });
        return;
      }

      let imageData: string = "";
      let prompt: string = "";
      let style: string = "";
      let userId: string = "";

      // Handle different content types
      if (req.get("content-type")?.includes("multipart/form-data")) {
        // Handle FormData from frontend
        const rawBody = req.rawBody?.toString() || "";
        // Parse multipart data manually (simplified)
        const parts = rawBody.split("------");
        for (const part of parts) {
          if (part.includes('name="image"')) {
            const base64Match = part.match(/data:image\/[^;]+;base64,([^"]+)/);
            if (base64Match) {
              imageData = `data:image/jpeg;base64,${base64Match[1]}`;
            }
          }
        }
      } else if (req.get("content-type")?.includes("application/json")) {
        // Handle JSON requests
        const body = req.body as any;
        imageData = body.imageData || "";
        prompt = body.prompt || "";
        style = body.style || "";
        userId = body.userId || "";
      }

      if (!imageData) {
        res.status(400).json({
          success: false,
          error: "No image data provided",
        });
        return;
      }

      // Validate base64 image format
      if (!imageData.startsWith("data:image/")) {
        res.status(400).json({
          success: false,
          error: "Invalid image format. Must be base64 encoded image.",
        });
        return;
      }

      const request: ImageGenerationRequest = {
        imageData,
        prompt,
        style,
        userId,
      };

      const result = await replicateService.generateImageFromWebcam(request);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Error in generateAIImage controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

/**
 * Get processing status for async operations
 */
export const getProcessingStatus = https.onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    try {
      const predictionId = req.query.predictionId as string;

      if (!predictionId) {
        res.status(400).json({
          success: false,
          error: "predictionId is required",
        });
        return;
      }

      const status = await replicateService.checkStatus(predictionId);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Error getting processing status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get processing status",
      });
    }
  }
);

/**
 * Health check endpoint
 */
export const healthCheck = https.onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: "AI Image Generation Service is running",
      timestamp: new Date().toISOString(),
    });
  }
);
