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
  generateAIImageColgate,
  getProcessingStatusColgate,
  healthCheckColgate,
} from "./controllers/imageController";

// Legacy endpoint for backwards compatibility (if needed)
export { generateAIImageColgate as processWebcamImageColgate } from "./controllers/imageController";
