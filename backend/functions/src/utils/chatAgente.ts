import * as admin from "firebase-admin";
import { DatatechPlantillaId } from "../config/datatech";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Puente con el agente de chat (proyecto chatgpt-claro-media).
 *
 * El chat vive en Vercel y este kiosco en Firebase Hosting, pero los dos
 * escriben en el MISMO proyecto de Firebase y en la misma colección. Cuando el
 * visitante llega desde una propuesta, el chat le pasa el ID de su documento
 * por la URL y el póster se guarda ahí, no en un registro aparte: así queda un
 * solo expediente por persona —propuesta y foto juntas— y el panel del chat lo
 * ve sin tener que cruzar nada.
 */
export const CHAT_COLLECTION = "ClaroMediaAgenteIA";

export interface PosterEnChat {
  plantilla: DatatechPlantillaId;
  plantillaPalabra: string;
  posterUrl: string;
  originalImageUrl: string;
  requestId: string;
  model: string;
}

/**
 * Añade el póster al documento de la conversación.
 *
 * Nunca lanza: el póster ya está generado y guardado en Storage, y perderlo
 * por un fallo de escritura sería absurdo.
 *
 * Se comprueba que el documento exista ANTES de escribir. El ID llega de la
 * barra de direcciones, así que puede venir mal escrito, recortado o apuntar a
 * una conversación ya borrada; con `set({merge:true})` a secas, cada uno de
 * esos casos crearía un documento huérfano que luego aparece en el panel del
 * chat como un registro sin nombre ni propuesta.
 *
 * `update` dentro de una transacción sería la alternativa, pero leer y escribir
 * por separado basta: si la conversación se borrara justo entre las dos, lo
 * único que se pierde es el enlace del póster, que igual queda en el registro
 * propio del kiosco.
 */
export const guardarPosterEnChat = async (
  docId: string,
  poster: PosterEnChat,
): Promise<boolean> => {
  try {
    const ref = admin.firestore().collection(CHAT_COLLECTION).doc(docId);

    if (!(await ref.get()).exists) {
      console.warn(
        `[DATATECH] ⚠️  La conversación ${docId} no existe; el póster queda solo en el registro del kiosco.`,
      );
      return false;
    }

    await ref.update({
      fotografiaIA: {
        ...poster,
        generadoEn: admin.firestore.Timestamp.now(),
      },
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[DATATECH] 🔗 Póster guardado en la conversación ${docId}`);
    return true;
  } catch (error) {
    console.error(
      `[DATATECH] ⚠️  No se pudo guardar el póster en la conversación ${docId}:`,
      error,
    );
    return false;
  }
};
