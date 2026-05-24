require("dotenv").config();

const admin = require("firebase-admin");
const Busboy = require("busboy");
const corsLib = require("cors");
const { onRequest } = require("firebase-functions/v2/https");

admin.initializeApp();

const COMFY_DEPLOY_API_KEY = process.env.COMFY_DEPLOY_API_KEY;
const COMFY_DEPLOY_BASE_URL = "https://api.comfydeploy.com/api/run";

// Nutricia: 3 estilos
const DEPLOYMENT_IDS = {
  bebelac: process.env.COMFY_DEPLOYMENT_BEBELAC,
  ejecutivo: process.env.COMFY_DEPLOYMENT_EJECUTIVO,
  nutrilon: process.env.COMFY_DEPLOYMENT_NUTRILON,
};

// Cabezoxxoz: deployment único
const CABEZOXXOZ_DEPLOYMENT_ID = process.env.COMFY_DEPLOYMENT_CABEZOXXOZ;

// CORS — orígenes permitidos desde variable de entorno (separados por coma)
// Ejemplo: CORS_ORIGINS=https://tudominio.com,http://localhost:5173
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : true; // true = permitir cualquier origen si no se configura

const corsHandler = corsLib({ origin: allowedOrigins });

// Promisifica cors para usarlo con async/await en gen2
function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

// ─── Helpers compartidos ──────────────────────────────────────────────────────

/**
 * Parsea un request multipart/form-data.
 * Retorna { uploads: [{ fieldname, buffer, filename, mimeType }], fields: {} }
 */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const uploads = [];
    const fields = {};

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      if (!filename || !mimeType.startsWith("image/")) {
        file.resume();
        return;
      }
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () =>
        uploads.push({ fieldname, buffer: Buffer.concat(chunks), filename, mimeType })
      );
    });

    busboy.on("finish", () => resolve({ uploads, fields }));
    busboy.on("error", reject);
    busboy.end(req.rawBody);
  });
}

/**
 * Sube un buffer de imagen a Firebase Storage.
 * Retorna la URL pública.
 */
async function uploadToStorage(buffer, filename, mimeType) {
  const bucket = admin.storage().bucket();
  const path = `temp_uploads/${Date.now()}_${filename}`;
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType: mimeType }, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

/**
 * Encola un run en ComfyDeploy y guarda el registro en Firestore.
 * Retorna el runId.
 */
async function queueAndSave(imageUrl, deploymentId, style, sessionId) {
  const comfyResponse = await fetch(`${COMFY_DEPLOY_BASE_URL}/deployment/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COMFY_DEPLOY_API_KEY}`,
    },
    body: JSON.stringify({
      deployment_id: deploymentId,
      inputs: { imageInput: imageUrl },
    }),
  });

  if (!comfyResponse.ok) {
    const errorText = await comfyResponse.text();
    console.error("❌ Error de ComfyDeploy:", errorText);
    throw new Error(`ComfyDeploy API error: ${comfyResponse.status}`);
  }

  const { run_id: runId } = await comfyResponse.json();
  console.log("✅ Run ID:", runId);

  await admin.firestore().collection("ComfyDeployRuns").doc(runId).set({
    runId,
    status: "queued",
    style: style || null,
    imageUrl,
    sessionId: sessionId || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return runId;
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * POST /processImage
 * Body FormData: { image, style }
 * Estilos: bebelac / ejecutivo / nutrilon
 */
exports.processImage = onRequest(
  { timeoutSeconds: 540, memory: "1GiB" },
  async (req, res) => {
    await runCors(req, res);
    if (res.headersSent) return; // OPTIONS preflight ya fue respondido

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { uploads, fields } = await parseMultipart(req);

      if (uploads.length === 0) {
        return res.status(400).json({ error: "No se recibió imagen" });
      }

      const { style } = fields;
      if (!style) {
        return res.status(400).json({ error: "Estilo no especificado" });
      }

      const deploymentId = DEPLOYMENT_IDS[style] || DEPLOYMENT_IDS.bebelac;
      if (!deploymentId) {
        return res.status(400).json({ error: "Deployment ID no configurado" });
      }

      const { buffer, filename, mimeType } = uploads[0];
      const imageUrl = await uploadToStorage(buffer, filename, mimeType);
      console.log("📤 Imagen subida:", imageUrl, "| Estilo:", style);

      const runId = await queueAndSave(imageUrl, deploymentId, style);

      return res.status(200).json({
        success: true,
        runId,
        style,
        message: "Imagen encolada para procesamiento",
      });
    } catch (error) {
      console.error("❌ Error procesando imagen:", error);
      return res.status(500).json({ error: "Error al procesar la imagen", message: error.message });
    }
  }
);

/**
 * POST /processImageCabezoxxoz
 * Body FormData: { image }
 * Deployment único, sin selección de estilo
 */
exports.processImageCabezoxxoz = onRequest(
  { timeoutSeconds: 540, memory: "1GiB" },
  async (req, res) => {
    await runCors(req, res);
    if (res.headersSent) return;

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!CABEZOXXOZ_DEPLOYMENT_ID) {
      return res.status(500).json({ error: "Deployment ID de Cabezoxxoz no configurado" });
    }

    try {
      const { uploads, fields } = await parseMultipart(req);

      if (uploads.length === 0) {
        return res.status(400).json({ error: "No se recibió imagen" });
      }

      const { buffer, filename, mimeType } = uploads[0];
      const imageUrl = await uploadToStorage(buffer, filename, mimeType);
      console.log("📤 [Cabezoxxoz] Imagen subida:", imageUrl);

      const runId = await queueAndSave(imageUrl, CABEZOXXOZ_DEPLOYMENT_ID, null, fields.sessionId || null);

      return res.status(200).json({
        success: true,
        runId,
        message: "Imagen encolada para procesamiento",
      });
    } catch (error) {
      console.error("❌ [Cabezoxxoz] Error procesando imagen:", error);
      return res.status(500).json({ error: "Error al procesar la imagen", message: error.message });
    }
  }
);

/**
 * GET /getRunStatus?runId=xxx
 * Consulta el estado de un run en ComfyDeploy.
 * Compartido entre todos los proyectos.
 */
exports.getRunStatus = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    await runCors(req, res);
    if (res.headersSent) return;

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { runId } = req.query;
    if (!runId) {
      return res.status(400).json({ error: "runId es requerido" });
    }

    try {
      console.log(`🔍 Consultando status del run: ${runId}`);

      const response = await fetch(`${COMFY_DEPLOY_BASE_URL}/${runId}`, {
        headers: { Authorization: `Bearer ${COMFY_DEPLOY_API_KEY}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error de ComfyDeploy:", errorText);
        throw new Error(`ComfyDeploy API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Status: ${data.status} (${Math.round(data.progress * 100)}%)`);

      await admin.firestore().collection("ComfyDeployRuns").doc(runId).update({
        status: data.status,
        progress: data.progress,
        live_status: data.live_status,
        outputs: data.outputs || [],
        ended_at: data.ended_at,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json(data);
    } catch (error) {
      console.error("❌ Error obteniendo status:", error);
      return res.status(500).json({ error: "Error al obtener status", message: error.message });
    }
  }
);

/**
 * POST /comfyDeployWebhook
 * Webhook de notificaciones de ComfyDeploy.
 * Compartido entre todos los proyectos.
 */
exports.comfyDeployWebhook = onRequest(
  {},
  async (req, res) => {
    await runCors(req, res);
    if (res.headersSent) return;

    try {
      const { run_id, status, outputs } = req.body;

      if (run_id) {
        await admin.firestore().collection("ComfyDeployRuns").doc(run_id).update({
          status,
          outputs: outputs || [],
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Run ${run_id} actualizado vía webhook: ${status}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("❌ Error en webhook:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);
