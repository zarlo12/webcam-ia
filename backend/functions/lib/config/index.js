"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPLICATE_MODELS = exports.rateLimitConfig = exports.corsConfig = exports.firebaseConfig = exports.replicateConfig = void 0;
exports.replicateConfig = {
    apiToken: process.env.REPLICATE_API_TOKEN || "",
    model: "tencentarc/photomaker",
    version: "ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
};
exports.firebaseConfig = {
    bucketName: process.env.STORAGE_BUCKET || "imagen-ia-845a3.appspot.com",
    folder: "generated-images",
};
exports.corsConfig = {
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
exports.rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // limit each IP to 10 requests per windowMs
};
// Replicate models configurations
exports.REPLICATE_MODELS = {
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
};
//# sourceMappingURL=index.js.map