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
