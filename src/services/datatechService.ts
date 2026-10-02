import axios from "axios";
import type { PlantillaId } from "../config/datatech";
import type { RegistroData } from "../screens/dt/Registro";

/**
 * Cliente de las Cloud Functions de Claro media · DATA TECH.
 *
 * Endpoints propios de esta activación — no se comparten con claro-tech-summit
 * (que está en producción), feria ni circus, aunque vivan en el mismo proyecto
 * de Firebase.
 */
const BASE_URL =
  import.meta.env.VITE_DATATECH_FUNCTIONS_URL ||
  "https://us-central1-imagen-ia-845a3.cloudfunctions.net";

const ENDPOINTS = {
  generate: `${BASE_URL}/generateDatatechImage`,
  health: `${BASE_URL}/datatechHealthCheck`,
};

export interface DatatechResponse {
  success: boolean;
  /** Póster terminado, listo para mostrar y descargar. */
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  plantilla?: PlantillaId;
  participanteId?: string | null;
}

class DatatechService {
  /**
   * Manda la foto del visitante y la plantilla elegida.
   *
   * El backend es dueño de la plantilla en alta y del prompt: aquí solo viaja
   * `plantilla` (1–5), así que nunca se pueden desincronizar.
   */
  async generate(
    photo: Blob,
    plantilla: PlantillaId,
    registro: RegistroData | null,
  ): Promise<DatatechResponse> {
    try {
      const formData = new FormData();
      formData.append("image", photo, "visitante.jpg");
      formData.append("plantilla", String(plantilla));
      if (registro) formData.append("correo", registro.correo);

      console.log("🟠 Enviando foto a la Cloud Function", {
        endpoint: ENDPOINTS.generate,
        plantilla,
        pesoFoto: photo.size,
      });

      const { data } = await axios.post<DatatechResponse>(
        ENDPOINTS.generate,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600000, // 10 min: la generación puede tardar varios minutos
        },
      );

      return data;
    } catch (error) {
      console.error("🟠 Error generando el póster:", error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Error de red al contactar el servicio",
        };
      }

      return { success: false, error: "Ocurrió un error inesperado" };
    }
  }

  async healthCheck(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = await axios.get(ENDPOINTS.health, { timeout: 10000 });
      return data;
    } catch {
      return { success: false, error: "Servicio no disponible" };
    }
  }
}

export default new DatatechService();
