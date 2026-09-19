import axios from "axios";
import type { FiltroId } from "../config/summit";
import type { RegistroData } from "../screens/Registro/Registro";

/**
 * Cliente de las Cloud Functions de Claro Tech Summit 2026.
 *
 * Endpoints propios de esta activación — no se comparten con feria-colombia,
 * circus ni VTEX, aunque vivan en el mismo proyecto de Firebase.
 *
 * URL base: se puede sobreescribir con VITE_SUMMIT_FUNCTIONS_URL (útil para el
 * emulador local). Por defecto usa la URL canónica de Cloud Functions; después
 * de desplegar, la CLI también imprime la variante de Cloud Run
 * (https://generatesummitimage-<hash>-uc.a.run.app) y sirve igual.
 */
const BASE_URL =
  import.meta.env.VITE_SUMMIT_FUNCTIONS_URL ||
  "https://us-central1-imagen-ia-845a3.cloudfunctions.net";

const ENDPOINTS = {
  generate: `${BASE_URL}/generateSummitImage`,
  health: `${BASE_URL}/summitHealthCheck`,
};

export interface SummitResponse {
  success: boolean;
  /** Imagen ya compuesta con el marco de la campaña. */
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  filtro?: FiltroId;
  participanteId?: string | null;
}

class SummitService {
  /**
   * Manda la foto del visitante y el estilo elegido.
   *
   * El backend es dueño de la referencia de estilo, del prompt y del marco:
   * aquí solo viaja `filtro` (1–4), así que nunca se pueden desincronizar.
   */
  async generate(
    photo: Blob,
    filtro: FiltroId,
    registro: RegistroData | null,
  ): Promise<SummitResponse> {
    try {
      const formData = new FormData();
      formData.append("image", photo, "visitante.jpg");
      formData.append("filtro", String(filtro));

      if (registro) {
        formData.append("nombre", registro.nombre);
        formData.append("apellido", registro.apellido);
        formData.append("cedula", registro.cedula);
        formData.append("correo", registro.correo);
        formData.append("autorizaDatos", String(registro.autorizaDatos));
      }

      console.log("🔴 Enviando foto a la Cloud Function", {
        endpoint: ENDPOINTS.generate,
        filtro,
        conRegistro: !!registro,
        pesoFoto: photo.size,
      });

      const { data } = await axios.post<SummitResponse>(
        ENDPOINTS.generate,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600000, // 10 min: la generación puede tardar varios minutos
        },
      );

      return data;
    } catch (error) {
      console.error("🔴 Error generando la imagen:", error);

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

export default new SummitService();
