import * as admin from "firebase-admin";
import { FERIA_COLLECTION, FeriaFilterId } from "../config/feria";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface FeriaParticipante {
  nombre?: string;
  cedula?: string;
  celular?: string;
  correo?: string;
  filtro: FeriaFilterId;
  filtroLabel: string;
  originalImageUrl: string;
  resultImageUrl: string;
  requestId: string;
  model: string;
}

/**
 * Guarda el registro del participante junto con las URLs de su foto.
 *
 * Nunca lanza: si Firestore falla, la imagen ya se generó y no queremos perderla
 * por un error de base de datos. Se registra en logs y sigue.
 */
export const saveFeriaParticipante = async (
  data: FeriaParticipante,
): Promise<string | null> => {
  try {
    const doc = await admin
      .firestore()
      .collection(FERIA_COLLECTION)
      .add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        campaign: "antioquia-nos-ensena-a-llegar-lejos",
      });

    console.log(`[FERIA] 🗄️  Registro guardado en Firestore: ${doc.id}`);
    return doc.id;
  } catch (error) {
    console.error(
      "[FERIA] ⚠️  No se pudo guardar el registro en Firestore:",
      error,
    );
    return null;
  }
};
