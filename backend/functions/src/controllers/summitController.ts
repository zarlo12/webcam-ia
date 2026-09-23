import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import summitReplicateService, {
  SummitGenerationRequest,
} from "../services/summitReplicateService";
import {
  SUMMIT_COLLECTION,
  SUMMIT_FILTERS,
  SUMMIT_MODEL,
  SUMMIT_STORAGE,
  isSummitFilterId,
} from "../config/summit";
import {
  detectImageMime,
  getBoundary,
  parseMultipartData,
  readRequestBody,
} from "../utils/multipart";

/**
 * Claro Tech Summit 2026 · Soluciones Digitales.
 *
 * Endpoints con nombre propio para que no choquen con los de las otras
 * campañas del mismo proyecto de Firebase (feria, circus, VTEX):
 *   - generateSummitImage
 *   - summitHealthCheck
 *   - getSummitStatus
 */

interface SummitPayload {
  filtro: unknown;
  prompt?: string;
  model?: string;
  nombre?: string;
  apellido?: string;
  cedula?: string;
  correo?: string;
  autorizaDatos?: unknown;
}

/** El formulario viaja como multipart, así que los booleanos llegan de texto. */
const toBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === "1";

/** Valida el payload y devuelve la request lista, o un mensaje de error. */
function buildRequest(
  imageData: string,
  payload: SummitPayload,
): { request?: SummitGenerationRequest; error?: string } {
  const filtro = Number(payload.filtro);

  if (!isSummitFilterId(filtro)) {
    return {
      error: `El campo 'filtro' es obligatorio y debe ser 1, 2, 3 o 4. Se recibió: ${JSON.stringify(payload.filtro)}`,
    };
  }

  return {
    request: {
      imageData,
      filtro,
      promptOverride: payload.prompt?.trim() || undefined,
      model: payload.model?.trim() || undefined,
      nombre: payload.nombre?.trim() || undefined,
      apellido: payload.apellido?.trim() || undefined,
      cedula: payload.cedula?.trim() || undefined,
      correo: payload.correo?.trim().toLowerCase() || undefined,
      autorizaDatos: toBoolean(payload.autorizaDatos),
    },
  };
}

export const generateSummitImage = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "2GiB",
    maxInstances: 5,
    region: "us-central1",
  },
  async (req, res) => {
    console.log("\n🔴 ===== SUMMIT · GENERAR IMAGEN =====");
    console.log(`🔴 ${req.method} · ${req.get("content-type")}`);

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
        console.log(`🔴 📦 Body: ${body.length} bytes`);

        const { fields, files } = parseMultipartData(body, boundary);
        const imageBuffer = files.image;

        if (!imageBuffer || imageBuffer.length === 0) {
          console.error("🔴 ❌ Sin archivo de imagen", {
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

        console.log(
          `🔴 ✅ Foto recibida: ${imageBuffer.length} bytes (${mimeType})`,
        );

        const { request, error } = buildRequest(
          imageData,
          fields as unknown as SummitPayload,
        );
        if (!request) {
          res.status(400).json({ success: false, error });
          return;
        }

        const result = await summitReplicateService.generate(request);
        console.log(`🔴 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
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

        const { request, error } = buildRequest(
          imageData,
          payload as SummitPayload,
        );
        if (!request) {
          res.status(400).json({ success: false, error });
          return;
        }

        const result = await summitReplicateService.generate(request);
        console.log(`🔴 ===== FIN (${result.success ? "OK" : "ERROR"}) =====\n`);
        res.status(result.success ? 200 : 400).json(result);
        return;
      }

      res.status(400).json({
        success: false,
        error:
          "Content-Type no soportado. Usa multipart/form-data o application/json.",
      });
    } catch (error) {
      console.error("🔴 ❌ Error no controlado:", error);
      res.status(500).json({
        success: false,
        error: "Error interno generando la imagen del Summit",
      });
    }
  },
);

export const summitHealthCheck = onRequest(
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
      service: "Claro Tech Summit 2026 · Soluciones Digitales",
      message: "🔴 Servicio activo",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      model: SUMMIT_MODEL,
      storage: SUMMIT_STORAGE,
      collection: SUMMIT_COLLECTION,
      filters: Object.values(SUMMIT_FILTERS).map((f) => ({
        filtro: f.id,
        label: f.label,
        referenceFile: f.referenceFile,
        promptLength: f.prompt.length,
      })),
    });
  },
);

/**
 * Listado de participantes para el panel de registros.
 *
 * Es de lectura y deliberadamente ABIERTO: así lo pidió el cliente. Las reglas
 * de Firestore siguen cerradas —quien lee aquí es el Admin SDK—, de modo que la
 * colección no queda expuesta a internet: solo lo que devuelve este endpoint.
 *
 * OJO: devuelve datos personales (nombre, cédula, correo). Para cerrarlo basta
 * con exigir un token: descomentar el bloque de PANEL_TOKEN de abajo y definir
 * la variable en el .env de las funciones.
 *
 * Pagina por cursor en vez de traerlo todo de golpe, para que un evento con
 * miles de registros no reviente la memoria de la función.
 */
export const listSummitParticipantes = onRequest(
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
        .collection(SUMMIT_COLLECTION)
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
          nombre: data.nombre ?? "",
          apellido: data.apellido ?? "",
          cedula: data.cedula ?? "",
          correo: data.correo ?? "",
          autorizaDatos: data.autorizaDatos === true,
          filtro: data.filtro ?? null,
          filtroLabel: data.filtroLabel ?? "",
          originalImageUrl: data.originalImageUrl ?? "",
          resultImageUrl: data.resultImageUrl ?? "",
          model: data.model ?? "",
          requestId: data.requestId ?? "",
          // ISO para que el panel no dependa del formato de Firestore.
          createdAt: createdAt ? createdAt.toDate().toISOString() : null,
        };
      });

      const last = snapshot.docs[snapshot.docs.length - 1];
      const lastCreatedAt = last?.get("createdAt") as
        | admin.firestore.Timestamp
        | undefined;

      res.status(200).json({
        success: true,
        collection: SUMMIT_COLLECTION,
        count: items.length,
        // Ausente cuando ya no hay más páginas.
        nextCursor:
          snapshot.size === limit && last && lastCreatedAt
            ? `${lastCreatedAt.toMillis()}|${last.id}`
            : null,
        items,
      });
    } catch (error) {
      console.error("🔴 Error listando participantes:", error);
      res.status(500).json({
        success: false,
        error: "No se pudo leer el listado de participantes",
      });
    }
  },
);

export const getSummitStatus = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1",
  },
  async (req, res) => {
    try {
      const predictionId = req.query.predictionId as string;

      if (!predictionId) {
        res
          .status(400)
          .json({ success: false, error: "predictionId es obligatorio" });
        return;
      }

      const status = await summitReplicateService.checkStatus(predictionId);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      console.error("🔴 Error consultando estado:", error);
      res
        .status(500)
        .json({ success: false, error: "No se pudo consultar el estado" });
    }
  },
);
