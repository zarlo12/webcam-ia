import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { setGlobalOptions } from "firebase-functions/v2";

// Configure global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Export the CIRCUS functions (project-specific)
export {
  generateCircusImage,
  circusHealthCheck,
  getCircusStatus,
} from "./controllers/circusController";

// Export the general functions (for other projects)
export {
  generateAIImage,
  getProcessingStatus,
  healthCheck,
  sendToVTEX,
} from "./controllers/imageController";

// Legacy endpoint for backwards compatibility (if needed)
export { generateAIImage as processWebcamImage } from "./controllers/imageController";
