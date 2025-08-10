"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = exports.isValidEmail = exports.retryWithBackoff = exports.delay = exports.isValidImageFormat = exports.generateFileName = exports.optimizeImageForAI = exports.base64ToBuffer = exports.generateRequestId = void 0;
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
/**
 * Generate a unique request ID
 */
const generateRequestId = () => {
    return (0, uuid_1.v4)();
};
exports.generateRequestId = generateRequestId;
/**
 * Convert base64 to buffer
 */
const base64ToBuffer = (base64) => {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
};
exports.base64ToBuffer = base64ToBuffer;
/**
 * Optimize image for AI processing
 */
const optimizeImageForAI = async (buffer) => {
    return await (0, sharp_1.default)(buffer)
        .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
    })
        .jpeg({ quality: 90 })
        .toBuffer();
};
exports.optimizeImageForAI = optimizeImageForAI;
/**
 * Generate filename with timestamp
 */
const generateFileName = (prefix = "image", extension = "jpg") => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uuid = (0, uuid_1.v4)().split("-")[0];
    return `${prefix}_${timestamp}_${uuid}.${extension}`;
};
exports.generateFileName = generateFileName;
/**
 * Validate image format
 */
const isValidImageFormat = (mimeType) => {
    const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validFormats.includes(mimeType.toLowerCase());
};
exports.isValidImageFormat = isValidImageFormat;
/**
 * Create a delay promise
 */
const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.delay = delay;
/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries - 1) {
                throw lastError;
            }
            const delayMs = baseDelay * Math.pow(2, attempt);
            await (0, exports.delay)(delayMs);
        }
    }
    throw lastError;
};
exports.retryWithBackoff = retryWithBackoff;
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-z0-9.-]/gi, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
//# sourceMappingURL=helpers.js.map