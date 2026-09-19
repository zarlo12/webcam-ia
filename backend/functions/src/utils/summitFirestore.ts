import * as admin from "firebase-admin";
import { SUMMIT_COLLECTION, SummitFilterId } from "../config/summit";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface SummitParticipante {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  correo?: string;
  /** Casilla de tratamiento de datos de la pantalla de registro. */
  autorizaDatos: boolean;
  filtro: SummitFilterId;
  filtroLabel: string;
  originalImageUrl: string;
  resultImageUrl: string;
  requestId: string;
  model: string;
}

/**
 * Guarda el registro del participante junto con las URLs de su foto.
 *
 * Nunca lanza: si Firestore falla, la imagen ya se generó y no queremos que el
 * visitante se quede sin ella por un error de base de datos. Se registra en
 * logs y sigue.
 */
export const saveSummitParticipante = async (
  data: SummitParticipante,
): Promise<string | null> => {
  try {
    const doc = await admin
      .firestore()
      .collection(SUMMIT_COLLECTION)
      .add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        campaign: "claro-tech-summit-2026",
      });

    console.log(`[SUMMIT] 🗄️  Registro guardado en Firestore: ${doc.id}`);
    return doc.id;
  } catch (error) {
    console.error(
      "[SUMMIT] ⚠️  No se pudo guardar el registro en Firestore:",
      error,
    );
    return null;
  }
};
