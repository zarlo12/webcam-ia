import sharp from "sharp";
import {
  DATATECH_ASPECT_RATIO,
  DATATECH_PLANTILLAS,
  DATATECH_STORAGE,
  DatatechPlantillaId,
} from "../config/datatech";
import { SummitProvider } from "../config/summit";
import { base64ToBuffer, generateRequestId, retryWithBackoff } from "../utils";
import { uploadToStorage } from "../utils/storage";
import { getPlantillaUrl } from "../utils/datatechAssets";
import { saveDatatechParticipante } from "../utils/datatechFirestore";
import { guardarPosterEnChat } from "../utils/chatAgente";
import { obtenerProveedor } from "./proveedores";

export interface DatatechGenerationRequest {
  /** Foto del visitante en base64 (data URL). */
  imageData: string;
  plantilla: DatatechPlantillaId;
  /** Prompt alterno para pruebas; si no viene se usa el de la plantilla. */
  promptOverride?: string;
  /** Modelo alterno para pruebas. */
  model?: string;
  /** Proveedor alterno para pruebas, sin tener que redesplegar. */
  provider?: SummitProvider;
  correo?: string;
  /**
   * Documento de ClaroMediaAgenteIA del que viene el visitante, cuando entró
   * desde una propuesta del chat. El póster se guarda también ahí.
   */
  chatDocId?: string;
}

export interface DatatechGenerationResponse {
  success: boolean;
  /** Póster terminado. Es el que se muestra y se descarga. */
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  plantilla?: DatatechPlantillaId;
  participanteId?: string | null;
  /** True si el póster quedó enlazado al documento del chat. */
  enlazadoAlChat?: boolean;
  debug?: {
    originalImage?: string;
    templateImage?: string;
    finalImage?: string;
    provider?: string;
    model?: string;
  };
}

/**
 * Resolución que se le pide al proveedor. Se pide 2K y se baja después: el
 * modelo cuida más el texto del póster cuando trabaja en grande, y el titular
 * y los logos son justo lo que no puede salir borroso.
 */
const RESOLUCION = "2K";

/** Medida final del póster: la de las plantillas y la de una story. */
const POSTER = { ancho: 1080, alto: 1920 };

/**
 * Prepara la foto del visitante para el modelo.
 *
 * Mientras más detalle del rostro reciba, mejor conserva el parecido. La
 * webcam captura 1600 px de lado mayor, así que esto no la agranda: la
 * normaliza y le quita peso a la subida.
 */
const optimizarFoto = async (buffer: Buffer): Promise<Buffer> =>
  sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer();

/**
 * Servicio de generación de Claro media · DATA TECH.
 *
 * El modelo recibe DOS imágenes en este orden:
 *   [0] la plantilla del póster elegido → IMAGE 1 en el prompt
 *   [1] la foto del visitante           → IMAGE 2 en el prompt
 * y devuelve el póster terminado.
 *
 * A diferencia del Summit, aquí NO se compone ningún marco después: la
 * plantilla ya trae el titular, el badge y los logos, así que lo que devuelve
 * el modelo se guarda tal cual.
 *
 * Quién ejecuta el modelo (Replicate o fal.ai) lo decide `proveedores.ts` a
 * partir de IMAGE_PROVIDER, igual que en las demás campañas.
 */
class DatatechImageService {
  async generate(
    request: DatatechGenerationRequest,
  ): Promise<DatatechGenerationResponse> {
    const requestId = generateRequestId();
    const plantilla = DATATECH_PLANTILLAS[request.plantilla];
    const prompt = request.promptOverride || plantilla.prompt;
    const proveedor = obtenerProveedor(request.provider, request.model);

    try {
      console.log(`[DATATECH-${requestId}] ▶ Plantilla ${plantilla.id} (${plantilla.palabra})`);
      console.log(`[DATATECH-${requestId}] Proveedor: ${proveedor.nombre} · ${proveedor.modelo}`);

      // 1. Subir la foto del visitante y resolver la plantilla.
      //    El proveedor necesita leer las dos por HTTP.
      const fotoBuffer = await optimizarFoto(base64ToBuffer(request.imageData));

      const [originalImageUrl, templateUrl] = await Promise.all([
        uploadToStorage(
          fotoBuffer,
          DATATECH_STORAGE.originals,
          `visitante_${requestId}.jpg`,
        ),
        getPlantillaUrl(plantilla.templateFile),
      ]);

      console.log(`[DATATECH-${requestId}] 📤 Foto subida: ${originalImageUrl}`);
      console.log(`[DATATECH-${requestId}] 🖼️  Plantilla: ${templateUrl}`);

      // 2. Generar: plantilla primero, foto después (así las nombra el prompt)
      const posterUrl = await retryWithBackoff(
        () =>
          proveedor.generar(
            {
              prompt,
              imagenes: [templateUrl, originalImageUrl],
              aspecto: DATATECH_ASPECT_RATIO,
              resolucion: RESOLUCION,
            },
            requestId,
          ),
        3,
        2000,
      );

      // 3. Persistir el póster en nuestro Storage. Lo que devuelve el modelo ya
      //    es la pieza final: no se le compone nada encima, solo se normaliza
      //    el tamaño (en 2K sale cerca de 1 MB, demasiado para descargarlo por
      //    QR con el wifi de un evento).
      const posterBuffer = await this.descargar(posterUrl);
      const finalImageUrl = await uploadToStorage(
        await this.normalizar(posterBuffer),
        DATATECH_STORAGE.generated,
        `poster_plantilla${plantilla.id}_${requestId}.jpg`,
      );

      console.log(`[DATATECH-${requestId}] ✅ Listo: ${finalImageUrl}`);

      // 4. Guardar los registros. Ninguno bloquea el resultado si falla.
      //
      //    Son dos escrituras con dueños distintos: el registro propio del
      //    kiosco, que alimenta su panel, y —si el visitante vino del chat— el
      //    documento de su conversación, para que propuesta y póster queden en
      //    el mismo expediente.
      const modelo = `${proveedor.nombre}:${proveedor.modelo}`;

      const [participanteId, enlazadoAlChat] = await Promise.all([
        saveDatatechParticipante({
          correo: request.correo,
          plantilla: plantilla.id,
          plantillaPalabra: plantilla.palabra,
          originalImageUrl,
          resultImageUrl: finalImageUrl,
          requestId,
          model: modelo,
          chatDocId: request.chatDocId,
        }),
        request.chatDocId
          ? guardarPosterEnChat(request.chatDocId, {
              plantilla: plantilla.id,
              plantillaPalabra: plantilla.palabra,
              posterUrl: finalImageUrl,
              originalImageUrl,
              requestId,
              model: modelo,
            })
          : Promise.resolve(false),
      ]);

      return {
        success: true,
        imageUrl: finalImageUrl,
        message: `Póster generado con la plantilla ${plantilla.palabra}`,
        requestId: `datatech-${requestId}`,
        plantilla: plantilla.id,
        participanteId,
        enlazadoAlChat,
        debug: {
          originalImage: originalImageUrl,
          templateImage: templateUrl,
          finalImage: finalImageUrl,
          provider: proveedor.nombre,
          model: proveedor.modelo,
        },
      };
    } catch (error) {
      console.error(`[DATATECH-${requestId}] ❌ Falló la generación:`, error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido durante la generación",
        requestId: `datatech-${requestId}`,
        plantilla: request.plantilla,
      };
    }
  }

  /**
   * Deja el póster en 1080×1920.
   *
   * `cover` no recorta nada apreciable: el modelo ya devuelve 9:16, así que
   * solo se ajusta el tamaño.
   */
  private async normalizar(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(POSTER.ancho, POSTER.alto, { fit: "cover" })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  private async descargar(url: string): Promise<Buffer> {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        `No se pudo descargar el póster generado: ${respuesta.statusText}`,
      );
    }

    return Buffer.from(await respuesta.arrayBuffer());
  }
}

export default new DatatechImageService();
