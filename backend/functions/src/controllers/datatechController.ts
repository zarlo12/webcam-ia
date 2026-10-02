import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import datatechImageService, {
  DatatechGenerationRequest,
} from "../services/datatechImageService";
import { esProveedorValido, proveedorActivo } from "../services/proveedores";
import { SUMMIT_MODELS, SummitProvider } from "../config/summit";
import {
  DATATECH_COLLECTION,
  DATATECH_PLANTILLAS,
  DATATECH_STORAGE,
  isDatatechPlantillaId,
} from "../config/datatech";
import {
  detectImageMime,
  getBoundary,
  parseMultipartData,
  readRequestBody,
} from "../utils/multipart";

/**
 * Claro media · DATA TECH — "15 minutos".
 *
 * Endpoints con nombre propio para que no choquen con los de las otras
 * campañas del mismo proyecto de Firebase. claro-tech-summit está EN
 * PRODUCCIÓN: reutilizar sus nombres la rompería.
 *   - generateDatatechImage
 *   - datatechHealthCheck
 *   - listDatatechParticipantes
 */

interface DatatechPayload {
  plantilla: unknown;
  prompt?: string;
  model?: string;
  provider?: string;
  correo?: string;
}

/** Valida el payload y devuelve la request lista, o un mensaje de error. */
function construirPeticion(
  imageData: string,
  payload: DatatechPayload,
): { request?: DatatechGenerationRequest; error?: string } {
  const plantilla = Number(payload.plantilla);

  if (!isDatatechPlantillaId(plantilla)) {
    return {
      error: `El campo 'plantilla' es obligatorio y debe ser 1, 2, 3, 4 o 5. Se recibió: ${JSON.stringify(payload.plantilla)}`,
    };
  }

  const pedido = payload.provider?.trim().toLowerCase();
  let provider: SummitProvider | undefined;
  if (pedido) {
    if (!esProveedorValido(pedido)) {
      return { error: `'provider' debe ser 'replicate' o 'fal'. Se recibió: ${pedido}` };
    }
    provider = pedido;
  }

  return {
    request: {
      imageData,
      plantilla,
      promptOverride: payload.prompt?.trim() || undefined,
      model: payload.model?.trim() || undefined,
      provider,
      correo: payload.correo?.trim().toLowerCase() || undefined,
    },
  };
}

export const generateDatatechImage = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
  },
  async (req, res) => {
    console.log("\n🟠 ===== DATA TECH · GENERAR PÓSTER =====");
    console.log(`🟠 ${req.method} · ${req.get("content-type")}`);

    try {
      if (req.method !== "POST") {
        res
          .status(405)
          .json({ success: false, error: "Método no permitido. Usa POST." });
        return;
      }

      const contentType = req.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const boundary = getBoundary(contentType);
        if (!boundary) {
          res.status(400).json({
            success: false,
            error: "No se encontró el boundary en el content-type",
          });
          return;
        }

        const body = await readRequestBody(req);
        console.log(`🟠 📦 Body: ${body.length} bytes`);

        const { fields, files } = parseMultipartData(body, boundary);
        const imageBuffer = files.image;

        if (!imageBuffer || imageBuffer.length === 0) {
          console.error("🟠 ❌ Sin archivo de imagen", {
            files: Object.keys(files),
            fields: Object.keys(fields),
          });
          res.status(400).json({
            success: false,
            error: "No se recibió la foto. Envíala en el campo 'image'.",
          });
          return;
        }

        const mimeType = detectImageMime(imageBuffer);
        const imageData = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

        console.log(`🟠 ✅ Foto recibida: ${imageBuffer.length} bytes (${mimeType})`);

        const { request, error } = construirPeticion(
          imageData,
          fields as unknown as DatatechPayload,
        );
        if (!request) {
          res.status(400).json({ success: false, error });
          return;
        }

        const result = await datatechImageService.generate(request);
        console.log(`🟠 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
        res.status(result.success ? 200 : 400).json(result);
        return;
      }

      if (contentType.includes("application/json")) {
        const { imageData, ...payload } = req.body || {};

        if (!imageData || typeof imageData !== "string") {
          res
            .status(400)
            .json({ success: false, error: "imageData es obligatorio" });
          return;
        }

        if (!imageData.startsWith("data:image/")) {
          res.status(400).json({
            success: false,
            error: "imageData debe ser una data URL base64 de imagen",
          });
          return;
        }

        const { request, error } = construirPeticion(
          imageData,
          payload as DatatechPayload,
        );
        if (!request) {
          res.status(400).json({ success: false, error });
          return;
        }

        const result = await datatechImageService.generate(request);
        console.log(`🟠 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
        res.status(result.success ? 200 : 400).json(result);
        return;
      }

      res.status(400).json({
        success: false,
        error:
          "Content-Type no soportado. Usa multipart/form-data o application/json.",
      });
    } catch (error) {
      console.error("🟠 ❌ Error no controlado:", error);
      res.status(500).json({
        success: false,
        error: "Error interno generando el póster",
      });
    }
  },
);

export const datatechHealthCheck = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "us-central1",
  },
  async (_req, res) => {
    res.status(200).json({
      success: true,
      service: "Claro media · DATA TECH — 15 minutos",
      message: "🟠 Servicio activo",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      provider: proveedorActivo(),
      model: SUMMIT_MODELS[proveedorActivo()],
      falKeyConfigurada: !!process.env.FAL_KEY,
      replicateTokenConfigurado: !!process.env.REPLICATE_API_TOKEN,
      aspectRatio: "9:16",
      storage: DATATECH_STORAGE,
      collection: DATATECH_COLLECTION,
      plantillas: Object.values(DATATECH_PLANTILLAS).map((p) => ({
        plantilla: p.id,
        palabra: p.palabra,
        titular: p.titular,
        templateFile: p.templateFile,
        promptLength: p.prompt.length,
      })),
    });
  },
);

/**
 * Listado de participantes para el panel de registros.
 *
 * Mismo patrón que en el Summit: lee con el Admin SDK, así que las reglas de
 * Firestore siguen cerradas y lo único expuesto es lo que devuelve este
 * endpoint, no la colección.
 *
 * OJO: devuelve el correo de los asistentes. Para cerrarlo basta con exigir un
 * token: descomentar el bloque de PANEL_TOKEN y definir la variable en el .env.
 */
export const listDatatechParticipantes = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1",
  },
  async (req, res) => {
    // Para proteger el panel, descomentar:
    // if (req.query.token !== process.env.PANEL_TOKEN) {
    //   res.status(401).json({ success: false, error: "No autorizado" });
    //   return;
    // }

    try {
      const limit = Math.min(Number(req.query.limit) || 500, 1000);
      const cursor = req.query.cursor as string | undefined;

      let query = admin
        .firestore()
        .collection(DATATECH_COLLECTION)
        .orderBy("createdAt", "desc")
        .orderBy(admin.firestore.FieldPath.documentId(), "desc");

      if (cursor) {
        const [millis, id] = cursor.split("|");
        query = query.startAfter(
          admin.firestore.Timestamp.fromMillis(Number(millis)),
          id,
        );
      }

      const snapshot = await query.limit(limit).get();

      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as admin.firestore.Timestamp | undefined;

        return {
          id: doc.id,
          correo: data.correo ?? "",
          plantilla: data.plantilla ?? null,
          plantillaPalabra: data.plantillaPalabra ?? "",
          originalImageUrl: data.originalImageUrl ?? "",
          resultImageUrl: data.resultImageUrl ?? "",
          model: data.model ?? "",
          requestId: data.requestId ?? "",
          createdAt: createdAt ? createdAt.toDate().toISOString() : null,
        };
      });

      const last = snapshot.docs[snapshot.docs.length - 1];
      const lastCreatedAt = last?.get("createdAt") as
        | admin.firestore.Timestamp
        | undefined;

      res.status(200).json({
        success: true,
        collection: DATATECH_COLLECTION,
        count: items.length,
        nextCursor:
          snapshot.size === limit && last && lastCreatedAt
            ? `${lastCreatedAt.toMillis()}|${last.id}`
            : null,
        items,
      });
    } catch (error) {
      console.error("🟠 Error listando participantes:", error);
      res.status(500).json({
        success: false,
        error: "No se pudo leer el listado de participantes",
      });
    }
  },
);
