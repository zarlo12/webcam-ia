// Cargar variables de entorno para desarrollo local
require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");

// Inicializar Firebase Admin
admin.initializeApp();

// Configuración de ComfyDeploy
const COMFY_DEPLOY_API_KEY = process.env.COMFY_DEPLOY_API_KEY;
const COMFY_DEPLOY_BASE_URL = "https://api.comfydeploy.com/api/run";

// IDs de deployment según el estilo
const DEPLOYMENT_IDS = {
  bebelac: process.env.COMFY_DEPLOYMENT_BEBELAC,
  ejecutivo: process.env.COMFY_DEPLOYMENT_EJECUTIVO,
  nutrilon: process.env.COMFY_DEPLOYMENT_NUTRILON,
};

/**
 * Cloud Function: Procesar imagen con ComfyDeploy
 * Endpoint: POST /processImage
 * Body: FormData con 'image' (archivo) y 'style' (string)
 * Returns: { success: true, runId: string, style: string }
 */
exports.processImage = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      // Solo permitir POST
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      try {
        const busboy = Busboy({ headers: req.headers });
        const uploads = [];
        const fields = {};

        // Procesar campos del formulario
        busboy.on("field", (fieldname, val) => {
          fields[fieldname] = val;
        });

        // Procesar archivo
        busboy.on("file", (fieldname, file, info) => {
          const { filename, mimeType } = info;

          if (!filename || !mimeType.startsWith("image/")) {
            file.resume();
            return;
          }

          const chunks = [];
          file.on("data", (chunk) => chunks.push(chunk));
          file.on("end", () => {
            uploads.push({
              fieldname,
              buffer: Buffer.concat(chunks),
              filename,
              mimeType,
            });
          });
        });

        // Cuando termina de parsear
        busboy.on("finish", async () => {
          try {
            if (uploads.length === 0) {
              return res.status(400).json({ error: "No se recibió imagen" });
            }

            const { style } = fields;
            if (!style) {
              return res.status(400).json({ error: "Estilo no especificado" });
            }

            const upload = uploads[0];
            const timestamp = Date.now();
            const filename = `temp_uploads/${timestamp}_${upload.filename}`;

            // Subir a Firebase Storage
            const bucket = admin.storage().bucket();
            const file = bucket.file(filename);

            await file.save(upload.buffer, {
              metadata: { contentType: upload.mimeType },
              public: true,
            });

            // Obtener URL pública
            const [metadata] = await file.getMetadata();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

            console.log("📤 Imagen subida a Storage:", imageUrl);
            console.log("🎨 Estilo:", style);

            // Seleccionar deployment_id según el estilo
            const deploymentId =
              DEPLOYMENT_IDS[style] || DEPLOYMENT_IDS.bebelac;

            if (!deploymentId) {
              return res
                .status(400)
                .json({ error: "Deployment ID no configurado" });
            }

            // Llamar a ComfyDeploy API
            const comfyResponse = await fetch(
              `${COMFY_DEPLOY_BASE_URL}/deployment/queue`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${COMFY_DEPLOY_API_KEY}`,
                },
                body: JSON.stringify({
                  deployment_id: deploymentId,
                  inputs: {
                    imageInput: imageUrl,
                  },
                }),
              },
            );

            if (!comfyResponse.ok) {
              const errorText = await comfyResponse.text();
              console.error("❌ Error de ComfyDeploy:", errorText);
              throw new Error(`ComfyDeploy API error: ${comfyResponse.status}`);
            }

            const comfyData = await comfyResponse.json();
            const runId = comfyData.run_id;

            console.log("✅ Run ID:", runId);

            // Guardar en Firestore
            await admin
              .firestore()
              .collection("ComfyDeployRuns")
              .doc(runId)
              .set({
                runId,
                status: "queued",
                style,
                imageUrl,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              });

            // Responder al frontend
            return res.status(200).json({
              success: true,
              runId,
              style,
              message: "Imagen encolada para procesamiento",
            });
          } catch (error) {
            console.error("❌ Error procesando imagen:", error);
            return res.status(500).json({
              error: "Error al procesar la imagen",
              message: error.message,
            });
          }
        });

        busboy.on("error", (error) => {
          console.error("❌ Error en busboy:", error);
          return res.status(500).json({ error: "Error procesando archivo" });
        });

        // Iniciar el parse
        busboy.end(req.rawBody);
      } catch (error) {
        console.error("❌ Error general:", error);
        return res.status(500).json({
          error: "Error interno del servidor",
          message: error.message,
        });
      }
    });
  });

/**
 * Cloud Function: Obtener status de un run
 * Endpoint: GET /getRunStatus?runId=xxx
 * Returns: ComfyDeploy status response
 */
exports.getRunStatus = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      try {
        const { runId } = req.query;

        if (!runId) {
          return res.status(400).json({ error: "runId es requerido" });
        }

        console.log(`🔍 Consultando status del run: ${runId}`);

        // Llamar a ComfyDeploy API
        const response = await fetch(`${COMFY_DEPLOY_BASE_URL}/${runId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${COMFY_DEPLOY_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Error de ComfyDeploy:", errorText);
          throw new Error(`ComfyDeploy API error: ${response.status}`);
        }

        const data = await response.json();

        console.log(
          `📊 Status: ${data.status} (${Math.round(data.progress * 100)}%)`,
        );

        // Actualizar en Firestore
        await admin
          .firestore()
          .collection("ComfyDeployRuns")
          .doc(runId)
          .update({
            status: data.status,
            progress: data.progress,
            live_status: data.live_status,
            outputs: data.outputs || [],
            ended_at: data.ended_at,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Responder con el status
        return res.status(200).json(data);
      } catch (error) {
        console.error("❌ Error obteniendo status:", error);
        return res.status(500).json({
          error: "Error al obtener status",
          message: error.message,
        });
      }
    });
  });

/**
 * Cloud Function: Webhook para recibir notificaciones de ComfyDeploy
 * (Opcional - si ComfyDeploy soporta webhooks)
 */
exports.comfyDeployWebhook = functions.https.onRequest(async (req, res) => {
  try {
    console.log("📥 Webhook recibido de ComfyDeploy:", req.body);

    const { run_id, status, outputs } = req.body;

    if (run_id) {
      // Actualizar en Firestore
      await admin
        .firestore()
        .collection("ComfyDeployRuns")
        .doc(run_id)
        .update({
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
});
