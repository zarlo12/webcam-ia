import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

/**
 * Generate a unique request ID
 */
export const generateRequestId = (): string => {
  return uuidv4();
};

/**
 * Convert base64 to buffer
 */
export const base64ToBuffer = (base64: string): Buffer => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
};

/**
 * Optimize image for AI processing
 */
export const optimizeImageForAI = async (buffer: Buffer): Promise<Buffer> => {
  return await sharp(buffer)
    .resize(1024, 1024, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
};

/**
 * Generate filename with timestamp
 */
export const generateFileName = (
  prefix: string = "image",
  extension: string = "jpg"
): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uuid = uuidv4().split("-")[0];
  return `${prefix}_${timestamp}_${uuid}.${extension}`;
};

/**
 * Validate image format
 */
export const isValidImageFormat = (mimeType: string): boolean => {
  const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return validFormats.includes(mimeType.toLowerCase());
};

/**
 * Create a delay promise
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw lastError!;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};
