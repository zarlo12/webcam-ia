import { https } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import replicateService from "../services/replicateService";
import { ImageGenerationRequest } from "../types";

// Simple multipart parser for Firebase Functions with support for multiple files
function parseMultipartData(
  body: Buffer,
  boundary: string,
): { fields: Record<string, string>; files: Record<string, Buffer[]> } {
  const fields: Record<string, string> = {};
  const files: Record<string, Buffer[]> = {};

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];

  let start = 0;
  let pos = body.indexOf(boundaryBuffer, start);

  while (pos !== -1) {
    if (start > 0) {
      parts.push(body.slice(start, pos));
    }
    start = pos + boundaryBuffer.length;
    pos = body.indexOf(boundaryBuffer, start);
  }

  parts.forEach((part) => {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const headers = part.slice(0, headerEnd).toString();
    const content = part.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    if (!nameMatch) return;

    const fieldName = nameMatch[1];

    if (headers.includes("filename=")) {
      // It's a file - support multiple files with same name or images[], image1, image2, etc.
      const fileBuffer = content.slice(0, -2); // Remove trailing \r\n
      // Initialize array if doesn't exist
      if (!files[fieldName]) {
        files[fieldName] = [];
      }

      // Add to array
      files[fieldName].push(fileBuffer);
    } else {
      // It's a text field
      fields[fieldName] = content.toString().trim();
    }
  });

  return { fields, files };
}

export const generateAIImage = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
  },
  async (req, res) => {
    try {
      console.log(`📥 ${req.method} request received - using custom parser v4`);

      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          error: "Method not allowed. Use POST.",
        });
        return;
      }

      // Handle multipart/form-data with custom parser
      if (req.get("content-type")?.includes("multipart/form-data")) {
        await handleMultipartRequest(req, res);
        return;
      }

      // Handle JSON requests
      if (req.get("content-type")?.includes("application/json")) {
        await handleJsonRequest(req, res);
        return;
      }

      res.status(400).json({
        success: false,
        error:
          "Unsupported content type. Use multipart/form-data or application/json.",
      });
    } catch (error) {
      console.error("❌ Error in generateAIImage controller:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

/**
 * Handle multipart/form-data requests using custom parser
 */
const handleMultipartRequest = async (req: any, res: any): Promise<void> => {
  try {
    console.log("📥 Processing multipart request with custom parser v2");

    const contentType = req.get("content-type") || "";
    const boundaryMatch = contentType.match(/boundary=(.+)$/);

    if (!boundaryMatch) {
      res.status(400).json({
        success: false,
        error: "No boundary found in content-type",
      });
      return;
    }

    const boundary = boundaryMatch[1].replace(/^-+/, "");
    console.log(`🔍 Boundary: ${boundary}`);

    // Get body data - try different ways to access it
    let body: Buffer;

    if (req.rawBody) {
      console.log("📦 Using req.rawBody");
      body = Buffer.isBuffer(req.rawBody)
        ? req.rawBody
        : Buffer.from(req.rawBody);
    } else if (req.body) {
      console.log("📦 Using req.body");
      body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    } else {
      console.log("📦 Reading from stream...");
      // Fallback to stream reading
      const chunks: Buffer[] = [];

      return new Promise((resolve) => {
        req.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          console.log(`📦 Chunk: ${chunk.length} bytes`);
        });

        req.on("end", async () => {
          try {
            const streamBody = Buffer.concat(chunks);
            await processMultipartBody(streamBody, boundary, res);
            resolve();
          } catch (error) {
            console.error("❌ Stream processing error:", error);
            res.status(400).json({
              success: false,
              error: "Failed to process stream data",
            });
            resolve();
          }
        });

        req.on("error", (error: Error) => {
          console.error("❌ Request stream error:", error);
          res.status(400).json({
            success: false,
            error: "Request stream error",
          });
          resolve();
        });
      });
    }

    console.log(`📦 Body size: ${body.length} bytes`);
    await processMultipartBody(body, boundary, res);
  } catch (error) {
    console.error("❌ Error processing multipart request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process image",
    });
  }
};

async function processMultipartBody(body: Buffer, boundary: string, res: any) {
  const { fields, files } = parseMultipartData(body, boundary);

  // Collect all image files - support multiple naming conventions
  const imageBuffers: Buffer[] = [];

  // Check for 'image' field (can be array)
  if (files.image && files.image.length > 0) {
    imageBuffers.push(...files.image);
  }

  // Check for 'images' field
  if (files.images && files.images.length > 0) {
    imageBuffers.push(...files.images);
  }

  // Check for numbered fields: image1, image2, image3, etc.
  Object.keys(files).forEach((key) => {
    if (key.match(/^image\d+$/)) {
      imageBuffers.push(...files[key]);
    }
  });

  if (imageBuffers.length === 0) {
    console.error("❌ No image files found");
    console.log("Available files:", Object.keys(files));
    console.log("Available fields:", Object.keys(fields));
    res.status(400).json({
      success: false,
      error:
        "No image files provided. Use 'image', 'images', or 'image1', 'image2', etc.",
    });
    return;
  }

  console.log(`✅ Received ${imageBuffers.length} image(s)`);
  imageBuffers.forEach((buf, idx) => {
    console.log(`   Image ${idx + 1}: ${buf.length} bytes`);
  });

  const prompt = fields.prompt || "";
  const style = fields.style || "";
  const userId = fields.userId || "";

  console.log(
    `📋 Parameters: prompt="${prompt.substring(0, 100)}...", style="${style}", userId="${userId}"`,
  );

  // Convert all buffers to base64 images
  const base64Images = imageBuffers.map((imageBuffer) => {
    let mimeType = "image/jpeg"; // default
    if (
      imageBuffer
        .slice(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      mimeType = "image/png";
    }

    return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  });

  const request: ImageGenerationRequest = {
    imageData: base64Images[0], // First image (backward compatibility)
    images: base64Images, // All images for multi-image support
    prompt,
    style,
    userId,
  };

  console.log(`🤖 Sending ${base64Images.length} image(s) to Replicate AI...`);
  const result = await replicateService.generateImageFromWebcam(request);

  res.status(result.success ? 200 : 400).json(result);
}

/**
 * Handle JSON requests
 */
const handleJsonRequest = async (req: any, res: any): Promise<void> => {
  const { imageData, prompt, style, userId } = req.body;

  if (!imageData) {
    res.status(400).json({
      success: false,
      error: "imageData is required",
    });
    return;
  }

  // Validate base64 image format
  if (!imageData.startsWith("data:image/")) {
    res.status(400).json({
      success: false,
      error: "Invalid image format. Must be base64 encoded image.",
    });
    return;
  }

  const request: ImageGenerationRequest = {
    imageData,
    prompt,
    style,
    userId,
  };

  const result = await replicateService.generateImageFromWebcam(request);
  res.status(result.success ? 200 : 400).json(result);
};

/**
 * Get processing status for async operations
 */
export const getProcessingStatus = https.onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    try {
      const predictionId = req.query.predictionId as string;

      if (!predictionId) {
        res.status(400).json({
          success: false,
          error: "predictionId is required",
        });
        return;
      }

      const status = await replicateService.checkStatus(predictionId);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Error getting processing status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get processing status",
      });
    }
  },
);

/**
 * Health check endpoint
 */
export const healthCheck = https.onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: "AI Image Generation Service is running",
      timestamp: new Date().toISOString(),
    });
  },
);

/**
 * Send data to VTEX CRM
 */
export const sendToVTEX = https.onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const data = req.body;

      // Validate required fields
      if (!data.email || !data.name) {
        res.status(400).json({ error: "Email and name are required" });
        return;
      }

      // Send to VTEX CRM
      const response = await fetch(
        "https://electroluxco.vtexcommercestable.com.br/api/dataentities/NL/documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-VTEX-API-AppKey": "vtexappkey-electroluxco-TKJHIX",
            "X-VTEX-API-AppToken":
              "NRYXTDVWTORDSZKJFIMEVHONLMSOKREDDDFVOAAWTUHRPWPNUTYBLGPRCYYCJSKHVWGHPKZMKVRMARRUXNVSXRYIGWGPGTHGHJPCXNPYLAMCPAECVQPZFQALCBNJGXBZ",
          },
          body: JSON.stringify(data),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Datos enviados exitosamente al CRM de VTEX:", result);
        res.status(200).json({
          success: true,
          message: "Data sent successfully to VTEX CRM",
          vtexResponse: result,
        });
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Error al enviar datos al CRM:",
          response.status,
          errorText,
        );
        res.status(response.status).json({
          error: "Failed to send data to VTEX CRM",
          details: errorText,
        });
      }
    } catch (error) {
      console.error("❌ Error de conexión con el CRM:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
