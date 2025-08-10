import * as admin from "firebase-admin";
import { firebaseConfig } from "../config";
import { generateFileName } from "./helpers";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const bucket = admin.storage().bucket(firebaseConfig.bucketName);

/**
 * Upload buffer to Firebase Storage
 */
export const uploadToStorage = async (
  buffer: Buffer,
  folder: string = firebaseConfig.folder,
  filename?: string
): Promise<string> => {
  const finalFilename = filename || generateFileName("generated", "jpg");
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

  return `https://storage.googleapis.com/${firebaseConfig.bucketName}/${filepath}`;
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFromStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Extract filepath from URL
    const urlParts = fileUrl.split("/");
    const filepath = urlParts.slice(4).join("/"); // Skip the domain parts

    const file = bucket.file(filepath);
    await file.delete();
  } catch (error) {
    console.warn("Failed to delete file from storage:", error);
  }
};

/**
 * Check if file exists in storage
 */
export const fileExists = async (filepath: string): Promise<boolean> => {
  try {
    const file = bucket.file(filepath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    return false;
  }
};
