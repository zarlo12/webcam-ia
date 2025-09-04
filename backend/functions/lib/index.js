"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processWebcamImageColgate = exports.healthCheckColgate = exports.getProcessingStatusColgate = exports.generateAIImageColgate = void 0;
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
const v2_1 = require("firebase-functions/v2");
// Configure global options
(0, v2_1.setGlobalOptions)({
    maxInstances: 10,
    region: "us-central1",
});
// Export the functions
var imageController_1 = require("./controllers/imageController");
Object.defineProperty(exports, "generateAIImageColgate", { enumerable: true, get: function () { return imageController_1.generateAIImageColgate; } });
Object.defineProperty(exports, "getProcessingStatusColgate", { enumerable: true, get: function () { return imageController_1.getProcessingStatusColgate; } });
Object.defineProperty(exports, "healthCheckColgate", { enumerable: true, get: function () { return imageController_1.healthCheckColgate; } });
// Legacy endpoint for backwards compatibility (if needed)
var imageController_2 = require("./controllers/imageController");
Object.defineProperty(exports, "processWebcamImageColgate", { enumerable: true, get: function () { return imageController_2.generateAIImageColgate; } });
//# sourceMappingURL=index.js.map