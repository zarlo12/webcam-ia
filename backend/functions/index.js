import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import {
  generateAIImage,
  getProcessingStatus,
  healthCheck,
} from "./src/controllers";
import * as cors from "cors";
import { corsConfig } from "./src/config";

// Configure global options
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 540, // 9 minutes for AI processing
  memory: "1GiB",
  region: "us-central1",
});

// Initialize CORS
const corsHandler = cors(corsConfig);

/**
 * Main AI Image Generation endpoint
 * Handles webcam image processing and AI generation
 */
export const aiImageGeneration = onRequest(
  {
    maxInstances: 5,
    timeoutSeconds: 540,
    memory: "2GiB",
    cors: true,
  },
  async (req, res) => {
    return corsHandler(req, res, () => generateAIImage(req, res));
  }
);

/**
 * Processing status endpoint
 * Check the status of async AI generation tasks
 */
export const processingStatus = onRequest(
  {
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    cors: true,
  },
  async (req, res) => {
    return corsHandler(req, res, () => getProcessingStatus(req, res));
  }
);

/**
 * Health check endpoint
 */
export const health = onRequest(
  {
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    return corsHandler(req, res, () => healthCheck(req, res));
  }
);

// Legacy endpoint for backwards compatibility (if needed)
export const processWebcamImage = aiImageGeneration;
