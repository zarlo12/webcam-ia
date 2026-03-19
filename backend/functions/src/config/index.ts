import { ReplicateConfig, FirebaseStorageConfig } from "../types";

export const replicateConfig: ReplicateConfig = {
  apiToken: process.env.REPLICATE_API_TOKEN || "",
  model: "black-forest-labs/flux-kontext-pro",
  version: "latest",
};

export const firebaseConfig: FirebaseStorageConfig = {
  bucketName: process.env.STORAGE_BUCKET || "imagen-ia-845a3.appspot.com",
  folder: "generated-images",
};

export const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://your-domain.com",
    "https://your-domain.vercel.app",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // limit each IP to 10 requests per windowMs
};

// Replicate models configurations
export const REPLICATE_MODELS = {
  // Primary model for multi-person photo composition
  NANO_BANANA: {
    model: "google/nano-banana-pro",
    version: "latest",
  },
  // Model for adding logo to clothing
  MULTI_IMAGE_KONTEXT: {
    model: "flux-kontext-apps/multi-image-kontext-max",
    version: "latest",
  },
  // Model for background removal
  BIREFNET: {
    model: "men1scus/birefnet",
    version: "f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7",
  },
  STABLE_DIFFUSION_XL: {
    model: "stability-ai/stable-diffusion-xl-base-1.0",
    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  },
  FACE_TO_STICKER: {
    model: "fofr/face-to-sticker",
    version: "764d4827ea159608a07cdde8ddf1c6000019627515eb02b6b449695fd547e5ef",
  },
  PORTRAIT_GENERATOR: {
    model: "tencentarc/photomaker",
    version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
  },
} as const;

// Logo URL for the multi-image processing
export const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/imagen-ia-845a3.firebasestorage.app/o/GUIAS%2FLOGO_FINAL.png?alt=media&token=16fc065b-d3e7-47a5-a480-78a7cf5956d7";
