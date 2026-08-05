import axios from "axios";
import type { StyleChoice } from "../App";
import type { RegistroData } from "../components/Registro/Registro";

/**
 * Cliente de las Cloud Functions de la campaña
 * "Antioquia nos enseña a llegar lejos" (Claro · Feria de las Flores).
 *
 * Endpoints propios de esta campaña — no se comparten con circus/VTEX ni con
 * otros proyectos del mismo proyecto de Firebase.
 *
 * URL base: se puede sobreescribir con VITE_FERIA_FUNCTIONS_URL (útil para el
 * emulador local). Por defecto usa la URL canónica de Cloud Functions; después
 * de desplegar, la CLI también imprime la variante de Cloud Run
 * (https://generateferiaimage-<hash>-uc.a.run.app) y sirve igual.
 */
const BASE_URL =
  import.meta.env.VITE_FERIA_FUNCTIONS_URL ||
  "https://us-central1-imagen-ia-845a3.cloudfunctions.net";

const ENDPOINTS = {
  generate: `${BASE_URL}/generateFeriaImage`,
  health: `${BASE_URL}/feriaHealthCheck`,
  status: `${BASE_URL}/getFeriaStatus`,
};

export interface FeriaResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
  requestId?: string;
  filtro?: StyleChoice;
  participanteId?: string | null;
  debug?: {
    originalImage?: string;
    templateImage?: string;
    finalImage?: string;
    model?: string;
  };
}

class FeriaService {
  /**
   * Manda la foto del visitante y el filtro elegido.
   *
   * El backend es dueño de la plantilla y del prompt: aquí solo se envía
   * `filtro` (1, 2 o 3) para que nunca se desincronicen.
   */
  async generate(
    photo: Blob,
    filtro: StyleChoice,
    registro?: RegistroData | null,
  ): Promise<FeriaResponse> {
    try {
      const formData = new FormData();
      formData.append("image", photo, "visitante.jpg");
      formData.append("filtro", String(filtro));

      if (registro) {
        formData.append("nombre", registro.nombre);
        formData.append("cedula", registro.cedula);
        formData.append("celular", registro.celular);
        formData.append("correo", registro.correo);
      }

      console.log("🌺 Enviando foto a la Cloud Function", {
        endpoint: ENDPOINTS.generate,
        filtro,
        conRegistro: !!registro,
        pesoFoto: photo.size,
      });

      const { data } = await axios.post<FeriaResponse>(
        ENDPOINTS.generate,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600000, // 10 min: la generación puede tardar varios minutos
        },
      );

      return data;
    } catch (error) {
      console.error("🌺 Error generando la foto:", error);

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

export default new FeriaService();
