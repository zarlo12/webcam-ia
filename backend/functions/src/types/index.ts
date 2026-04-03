export interface ImageGenerationRequest {
  imageData: string; // Base64 encoded image (first/main image)
  images?: string[]; // Array of base64 encoded images for multi-image support
  prompt?: string;
  style?: string;
  userId?: string;
  model?: string; // Replicate model to use (e.g., "google/nano-banana-pro" or "google/nano-banana")
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  // Debug information for pipeline steps
  debug?: {
    step1_logo?: string; // Result from multi-image-kontext-max (logo added)
    step2_styled?: string; // Result from flux-kontext-pro (style converted)
    step3_final?: string; // Result from BiRefNet (background removed)
    originalImage?: string; // Original uploaded image (deprecated)
    originalImages?: string[]; // Array of original images
    finalImage?: string; // Final result
    imageCount?: number; // Number of images processed
    mode?: string; // Style/character mode used for transformation
  };
}

export interface ReplicateConfig {
  apiToken: string;
  model: string;
  version: string;
}

export interface ProcessingStatus {
  id: string;
  status: "processing" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export enum ImageStyle {
  REALISTIC = "realistic",
  ARTISTIC = "artistic",
  CARTOON = "cartoon",
  PROFESSIONAL = "professional",
  VINTAGE = "vintage",
}

export interface FirebaseStorageConfig {
  bucketName: string;
  folder: string;
}
