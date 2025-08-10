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
exports.fileExists = exports.deleteFromStorage = exports.uploadToStorage = void 0;
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const helpers_1 = require("./helpers");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const bucket = admin.storage().bucket(config_1.firebaseConfig.bucketName);
/**
 * Upload buffer to Firebase Storage
 */
const uploadToStorage = async (buffer, folder = config_1.firebaseConfig.folder, filename) => {
    const finalFilename = filename || (0, helpers_1.generateFileName)("generated", "jpg");
    const filepath = `${folder}/${finalFilename}`;
    const file = bucket.file(filepath);
    await file.save(buffer, {
        metadata: {
            contentType: "image/jpeg",
            metadata: {
                uploadedAt: new Date().toISOString(),
                source: "ai-generation",
            },
        },
    });
    // Make the file publicly accessible
    await file.makePublic();
    return `https://storage.googleapis.com/${config_1.firebaseConfig.bucketName}/${filepath}`;
};
exports.uploadToStorage = uploadToStorage;
/**
 * Delete file from Firebase Storage
 */
const deleteFromStorage = async (fileUrl) => {
    try {
        // Extract filepath from URL
        const urlParts = fileUrl.split("/");
        const filepath = urlParts.slice(4).join("/"); // Skip the domain parts
        const file = bucket.file(filepath);
        await file.delete();
    }
    catch (error) {
        console.warn("Failed to delete file from storage:", error);
    }
};
exports.deleteFromStorage = deleteFromStorage;
/**
 * Check if file exists in storage
 */
const fileExists = async (filepath) => {
    try {
        const file = bucket.file(filepath);
        const [exists] = await file.exists();
        return exists;
    }
    catch (error) {
        return false;
    }
};
exports.fileExists = fileExists;
//# sourceMappingURL=storage.js.map