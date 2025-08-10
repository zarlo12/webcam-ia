import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { setGlobalOptions } from "firebase-functions/v2";

// Configure global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Export the functions
export {
  generateAIImage,
  getProcessingStatus,
  healthCheck,
} from "./controllers/imageController";

// Legacy endpoint for backwards compatibility (if needed)
export { generateAIImage as processWebcamImage } from "./controllers/imageController";
