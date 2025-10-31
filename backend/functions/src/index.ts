import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { setGlobalOptions } from "firebase-functions/v2";

// Configure global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Export the functions with new names for webcam-ia project
export {
  generateAIImage as webcamGenerateAI,
  getProcessingStatus as webcamProcessingStatus,
  healthCheck as webcamHealthCheck,
  sendToVTEX as webcamSendToVTEX,
} from "./controllers/imageController";

// Legacy endpoint for backwards compatibility (if needed)
export { generateAIImage as processWebcamImage } from "./controllers/imageController";
