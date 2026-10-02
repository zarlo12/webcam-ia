import * as admin from "firebase-admin";
import { DATATECH_COLLECTION, DatatechPlantillaId } from "../config/datatech";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface DatatechParticipante {
  /** El registro de esta activación pide solo el correo. */
  correo?: string;
  plantilla: DatatechPlantillaId;
  plantillaPalabra: string;
  originalImageUrl: string;
  resultImageUrl: string;
  requestId: string;
  model: string;
  /** Documento de ClaroMediaAgenteIA, si el visitante vino del chat. */
  chatDocId?: string;
}

/**
 * Guarda el registro del participante junto con las URLs de su foto.
 *
 * Nunca lanza: si Firestore falla, la imagen ya se generó y no queremos que el
 * visitante se quede sin ella por un error de base de datos. Se registra en
 * logs y sigue.
 */
export const saveDatatechParticipante = async (
  data: DatatechParticipante,
): Promise<string | null> => {
  try {
    const doc = await admin
      .firestore()
      .collection(DATATECH_COLLECTION)
      .add({
        ...data,
        // Firestore rechaza undefined; sin visitante del chat el campo no va.
        chatDocId: data.chatDocId ?? null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        campaign: "claro-media-datatech-15-minutos",
      });

    console.log(`[DATATECH] 🗄️  Registro guardado en Firestore: ${doc.id}`);
    return doc.id;
  } catch (error) {
    console.error(
      "[DATATECH] ⚠️  No se pudo guardar el registro en Firestore:",
      error,
    );
    return null;
  }
};
