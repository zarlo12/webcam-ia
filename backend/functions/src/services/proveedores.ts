import Replicate from "replicate";
import { replicateConfig } from "../config";
import { SUMMIT_MODELS, SummitProvider } from "../config/summit";

/**
 * Proveedores de generación de imagen.
 *
 * El resto del servicio no sabe con cuál está hablando: le pasa el prompt y dos
 * URLs y recibe la URL de la imagen generada. Cambiar de proveedor es cambiar
 * una variable de entorno, sin tocar prompts, composición ni frontend.
 *
 * Los dos reciben las imágenes en el MISMO orden —[referencia de estilo, foto
 * del visitante]— porque así las nombra el prompt (IMAGE 1 / IMAGE 2).
 */

export interface PeticionImagen {
  prompt: string;
  /** [referencia de estilo, foto del visitante]. El orden importa. */
  imagenes: string[];
  aspecto: string;
  resolucion: string;
}

export interface Proveedor {
  nombre: SummitProvider;
  modelo: string;
  generar(peticion: PeticionImagen, requestId: string): Promise<string>;
}

/** Tope propio por petición; la función entera muere a los 540 s. */
const TIEMPO_LIMITE_MS = 300_000;

/* ------------------------------------------------------------------ Replicate */

let replicate: Replicate | null = null;

const clienteReplicate = () => {
  if (replicate) return replicate;
  if (!replicateConfig.apiToken) {
    throw new Error("Falta REPLICATE_API_TOKEN");
  }
  replicate = new Replicate({ auth: replicateConfig.apiToken });
  return replicate;
};

/** Replicate devuelve la salida de varias formas según el modelo y la versión. */
const urlDesdeReplicate = (salida: unknown): string => {
  if (Array.isArray(salida)) {
    const primera = salida[0];
    if (primera && typeof primera === "object" && "url" in (primera as any)) {
      return (primera as any).url().toString();
    }
    return String(primera);
  }
  if (salida && typeof salida === "object" && "url" in (salida as any)) {
    return (salida as any).url().toString();
  }
  if (typeof salida === "string") return salida;
  throw new Error("Formato de salida inesperado de Replicate");
};

const proveedorReplicate = (modelo: string): Proveedor => ({
  nombre: "replicate",
  modelo,
  async generar({ prompt, imagenes, aspecto, resolucion }, requestId) {
    const input = {
      prompt,
      image_input: imagenes,
      aspect_ratio: aspecto,
      output_format: "jpg",
      resolution: resolucion,
      // Sin búsquedas externas: la referencia visual son las dos imágenes.
      image_search: false,
      google_search: false,
    };

    console.log(`[SUMMIT-${requestId}] 🤖 replicate ${modelo} · ${prompt.length} chars`);
    const salida = await clienteReplicate().run(modelo as any, { input });
    return urlDesdeReplicate(salida);
  },
});

/* ------------------------------------------------------------------- fal.ai */

/**
 * fal.ai por REST, sin SDK: son treinta líneas y una dependencia menos que
 * instalar y desplegar (que en mitad de una caída es justo lo que no sobra).
 *
 * `fal.run` es la variante síncrona — responde con la imagen ya lista, así que
 * no hace falta ir a consultar una cola.
 */
const proveedorFal = (modelo: string): Proveedor => ({
  nombre: "fal",
  modelo,
  async generar({ prompt, imagenes, aspecto, resolucion }, requestId) {
    const clave = process.env.FAL_KEY;
    if (!clave) throw new Error("Falta FAL_KEY");

    const cuerpo = {
      prompt,
      image_urls: imagenes,
      aspect_ratio: aspecto,
      output_format: "jpeg",
      resolution: resolucion,
      num_images: 1,
    };

    console.log(`[SUMMIT-${requestId}] 🤖 fal ${modelo} · ${prompt.length} chars`);

    const corte = new AbortController();
    const alarma = setTimeout(() => corte.abort(), TIEMPO_LIMITE_MS);

    let respuesta: Response;
    try {
      respuesta = await fetch(`https://fal.run/${modelo}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${clave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpo),
        signal: corte.signal,
      });
    } finally {
      clearTimeout(alarma);
    }

    if (!respuesta.ok) {
      // El detalle de fal explica qué campo está mal; sin él, depurar es a ciegas.
      const detalle = await respuesta.text().catch(() => "");
      throw new Error(
        `fal.ai respondió ${respuesta.status}: ${detalle.slice(0, 400) || respuesta.statusText}`,
      );
    }

    const datos = (await respuesta.json()) as { images?: { url?: string }[] };
    const url = datos.images?.[0]?.url;
    if (!url) throw new Error("fal.ai no devolvió ninguna imagen");

    return url;
  },
});

/* ------------------------------------------------------------------ Selección */

/**
 * Se lee del entorno en cada llamada, no al cargar el módulo: así el valor no
 * depende de si dotenv corrió antes que este import.
 */
export const proveedorActivo = (): SummitProvider => {
  const valor = (process.env.IMAGE_PROVIDER || "").trim().toLowerCase();
  if (valor === "fal" || valor === "replicate") return valor;

  // Un typo no puede pasar en silencio: dejaría el kiosco en el proveedor que
  // justamente se quería abandonar.
  if (valor) {
    console.warn(
      `[SUMMIT] ⚠️  IMAGE_PROVIDER="${valor}" no se reconoce; se usa replicate. Valores válidos: replicate, fal.`,
    );
  }
  return "replicate";
};

export const obtenerProveedor = (
  forzado?: SummitProvider,
  modeloForzado?: string,
): Proveedor => {
  const nombre = forzado || proveedorActivo();
  const modelo = modeloForzado || SUMMIT_MODELS[nombre];
  return nombre === "fal" ? proveedorFal(modelo) : proveedorReplicate(modelo);
};

export const esProveedorValido = (v: unknown): v is SummitProvider =>
  v === "replicate" || v === "fal";

/**
 * Estado de una predicción de Replicate.
 *
 * Vive aquí y no en el servicio porque es lo único que NO se puede abstraer:
 * en fal.ai se usa el endpoint síncrono, que devuelve la imagen en la misma
 * petición y no deja ninguna predicción que consultar.
 */
export const estadoReplicate = async (predictionId: string) => {
  const prediction = await clienteReplicate().predictions.get(predictionId);

  return {
    id: predictionId,
    status:
      prediction.status === "succeeded"
        ? "completed"
        : prediction.status === "failed"
          ? "failed"
          : "processing",
    imageUrl: prediction.output
      ? ((Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output) as string)
      : undefined,
    error: prediction.error?.toString(),
    createdAt: new Date(prediction.created_at),
    completedAt: prediction.completed_at
      ? new Date(prediction.completed_at)
      : undefined,
  };
};
