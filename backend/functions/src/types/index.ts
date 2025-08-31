export interface ImageGenerationRequest {
  imageData: string; // Base64 encoded image
  prompt?: string;
  style?: string;
  userId?: string;
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
    originalImage?: string; // Original uploaded image
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
