import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type {
  ComfyDeployQueueResponse,
  ComfyDeployStatusResponse,
} from "../types/comfyDeploy";

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  "http://127.0.0.1:5001/cabezoxxoz-2/us-central1";

const PROCESS_IMAGE_URL = `${FUNCTIONS_BASE_URL}/processImage`;
const PROCESS_IMAGE_CABEZOXXOZ_URL = `${FUNCTIONS_BASE_URL}/processImageCabezoxxoz`;
const GET_RUN_STATUS_URL = `${FUNCTIONS_BASE_URL}/getRunStatus`;

/**
 * Envía una imagen a ComfyDeploy para procesamiento (vía Cloud Function)
 */
export const queueImageProcessing = async (
  imageBlob: Blob,
  style: string,
): Promise<ComfyDeployQueueResponse> => {
  try {
    console.log("📤 Enviando imagen a Cloud Function...");
    console.log("🎨 Estilo seleccionado:", style);

    // Crear FormData con la imagen y el estilo
    const formData = new FormData();
    formData.append("image", imageBlob, "webcam-image.jpg");
    formData.append("style", style);

    // Llamar a la Cloud Function
    const response = await fetch(PROCESS_IMAGE_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Error desconocido" }));
      console.error("❌ Error en Cloud Function:", errorData);
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("✅ Respuesta de Cloud Function:", data);

    return {
      run_id: data.runId,
      status: "queued",
    } as ComfyDeployQueueResponse;
  } catch (error) {
    console.error("❌ Error en queueImageProcessing:", error);
    throw error;
  }
};

/**
 * Envía una imagen a ComfyDeploy para el proyecto Cabezoxxoz (sin selección de estilo)
 */
export const queueImageProcessingCabezoxxoz = async (
  imageBlob: Blob,
): Promise<ComfyDeployQueueResponse> => {
  try {
    console.log("📤 [Cabezoxxoz] Enviando imagen a Cloud Function...");

    const formData = new FormData();
    formData.append("image", imageBlob, "webcam-image.jpg");

    const response = await fetch(PROCESS_IMAGE_CABEZOXXOZ_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Error desconocido" }));
      console.error("❌ [Cabezoxxoz] Error en Cloud Function:", errorData);
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log("✅ [Cabezoxxoz] Respuesta de Cloud Function:", data);

    return {
      run_id: data.runId,
      status: "queued",
    } as ComfyDeployQueueResponse;
  } catch (error) {
    console.error("❌ [Cabezoxxoz] Error en queueImageProcessingCabezoxxoz:", error);
    throw error;
  }
};

/**
 * Obtiene el estado actual de un run en ComfyDeploy dado una URL base.
 */
const fetchRunStatus = async (url: string): Promise<ComfyDeployStatusResponse> => {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<ComfyDeployStatusResponse>;
};

/**
 * Obtiene el estado actual de un run — Proyecto Nutricia
 */
export const getRunStatus = async (
  runId: string,
): Promise<ComfyDeployStatusResponse> => {
  try {
    return await fetchRunStatus(`${GET_RUN_STATUS_URL}?runId=${runId}`);
  } catch (error) {
    console.error("❌ Error en getRunStatus:", error);
    throw error;
  }
};

/**
 * Obtiene el estado actual de un run — Proyecto Cabezoxxoz
 */
export const getRunStatusCabezoxxoz = async (
  runId: string,
): Promise<ComfyDeployStatusResponse> => {
  try {
    return await fetchRunStatus(`${GET_RUN_STATUS_URL}?runId=${runId}`);
  } catch (error) {
    console.error("❌ [Cabezoxxoz] Error en getRunStatusCabezoxxoz:", error);
    throw error;
  }
};

/**
 * Guarda el estado del run en Firestore (sin duplicar)
 */
export const saveRunStatusToFirestore = async (
  runId: string,
  status: ComfyDeployStatusResponse,
): Promise<void> => {
  try {
    const runDocRef = doc(db, "ComfyDeployRuns", runId);

    // Verificar si ya existe para no sobrescribir innecesariamente
    const docSnap = await getDoc(runDocRef);

    const dataToSave = {
      runId: status.id,
      status: status.status,
      progress: status.progress,
      live_status: status.live_status,
      workflow_inputs: status.workflow_inputs,
      created_at: status.created_at,
      updated_at: status.updated_at,
      started_at: status.started_at,
      ended_at: status.ended_at,
      duration: status.duration,
      outputs: status.outputs,
      lastChecked: new Date().toISOString(),
    };

    if (docSnap.exists()) {
      // Solo actualizar si el estado cambió
      const existingData = docSnap.data();
      if (
        existingData.status !== status.status ||
        existingData.progress !== status.progress
      ) {
        await setDoc(runDocRef, dataToSave, { merge: true });
        console.log(
          `📝 Status actualizado en Firestore: ${runId} - ${status.status}`,
        );
      }
    } else {
      // Crear nuevo documento
      await setDoc(runDocRef, dataToSave);
      console.log(`📝 Nuevo run guardado en Firestore: ${runId}`);
    }
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
    // No lanzar error para no interrumpir el flujo
  }
};

/**
 * Extrae la URL de la imagen generada del output
 */
export const extractGeneratedImageUrl = (
  status: ComfyDeployStatusResponse,
): string | null => {
  if (
    status.status !== "success" ||
    !status.outputs ||
    status.outputs.length === 0
  ) {
    return null;
  }

  // Buscar el output que contiene la imagen
  for (const output of status.outputs) {
    if (output.data.images && output.data.images.length > 0) {
      return output.data.images[0].url;
    }
  }

  return null;
};

/**
 * Extrae el mensaje de error del output
 */
export const extractErrorMessage = (
  status: ComfyDeployStatusResponse,
): string | null => {
  if (
    status.status !== "failed" ||
    !status.outputs ||
    status.outputs.length === 0
  ) {
    return null;
  }

  // Buscar el output que contiene el mensaje de error
  for (const output of status.outputs) {
    if (output.data.text && output.data.text.length > 0) {
      return output.data.text[0];
    }
  }

  return "Error desconocido al procesar la imagen";
};

/**
 * Polling para esperar hasta que el run termine (success o failed)
 */
export const waitForRunCompletion = async (
  runId: string,
  onProgress?: (status: ComfyDeployStatusResponse) => void,
  maxAttempts: number = 120, // 120 intentos * 3 segundos = 6 minutos máximo
  intervalMs: number = 3000,
): Promise<ComfyDeployStatusResponse> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        attempts++;

        const status = await getRunStatus(runId);

        // Guardar el estado en Firestore
        await saveRunStatusToFirestore(runId, status);

        // Notificar progreso
        if (onProgress) {
          onProgress(status);
        }

        console.log(
          `🔄 Checking run ${runId}: ${status.status} (${Math.round(status.progress * 100)}%)`,
        );

        // Si terminó (success o failed), resolver
        if (status.status === "success" || status.status === "failed") {
          resolve(status);
        } else if (attempts >= maxAttempts) {
          reject(new Error("Tiempo máximo de espera excedido"));
        } else {
          // Continuar verificando
          setTimeout(checkStatus, intervalMs);
        }
      } catch (error) {
        console.error("Error en checkStatus:", error);
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          // Reintentar
          setTimeout(checkStatus, intervalMs);
        }
      }
    };

    checkStatus();
  });
};
