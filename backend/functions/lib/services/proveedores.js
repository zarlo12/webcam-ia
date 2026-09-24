"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estadoReplicate = exports.esProveedorValido = exports.obtenerProveedor = exports.proveedorActivo = void 0;
const replicate_1 = __importDefault(require("replicate"));
const config_1 = require("../config");
const summit_1 = require("../config/summit");
/** Tope propio por petición; la función entera muere a los 540 s. */
const TIEMPO_LIMITE_MS = 300_000;
/* ------------------------------------------------------------------ Replicate */
let replicate = null;
const clienteReplicate = () => {
    if (replicate)
        return replicate;
    if (!config_1.replicateConfig.apiToken) {
        throw new Error("Falta REPLICATE_API_TOKEN");
    }
    replicate = new replicate_1.default({ auth: config_1.replicateConfig.apiToken });
    return replicate;
};
/** Replicate devuelve la salida de varias formas según el modelo y la versión. */
const urlDesdeReplicate = (salida) => {
    if (Array.isArray(salida)) {
        const primera = salida[0];
        if (primera && typeof primera === "object" && "url" in primera) {
            return primera.url().toString();
        }
        return String(primera);
    }
    if (salida && typeof salida === "object" && "url" in salida) {
        return salida.url().toString();
    }
    if (typeof salida === "string")
        return salida;
    throw new Error("Formato de salida inesperado de Replicate");
};
const proveedorReplicate = (modelo) => ({
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
        const salida = await clienteReplicate().run(modelo, { input });
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
const proveedorFal = (modelo) => ({
    nombre: "fal",
    modelo,
    async generar({ prompt, imagenes, aspecto, resolucion }, requestId) {
        const clave = process.env.FAL_KEY;
        if (!clave)
            throw new Error("Falta FAL_KEY");
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
        let respuesta;
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
        }
        finally {
            clearTimeout(alarma);
        }
        if (!respuesta.ok) {
            // El detalle de fal explica qué campo está mal; sin él, depurar es a ciegas.
            const detalle = await respuesta.text().catch(() => "");
            throw new Error(`fal.ai respondió ${respuesta.status}: ${detalle.slice(0, 400) || respuesta.statusText}`);
        }
        const datos = (await respuesta.json());
        const url = datos.images?.[0]?.url;
        if (!url)
            throw new Error("fal.ai no devolvió ninguna imagen");
        return url;
    },
});
/* ------------------------------------------------------------------ Selección */
/**
 * Se lee del entorno en cada llamada, no al cargar el módulo: así el valor no
 * depende de si dotenv corrió antes que este import.
 */
const proveedorActivo = () => {
    const valor = (process.env.IMAGE_PROVIDER || "").trim().toLowerCase();
    if (valor === "fal" || valor === "replicate")
        return valor;
    // Un typo no puede pasar en silencio: dejaría el kiosco en el proveedor que
    // justamente se quería abandonar.
    if (valor) {
        console.warn(`[SUMMIT] ⚠️  IMAGE_PROVIDER="${valor}" no se reconoce; se usa replicate. Valores válidos: replicate, fal.`);
    }
    return "replicate";
};
exports.proveedorActivo = proveedorActivo;
const obtenerProveedor = (forzado, modeloForzado) => {
    const nombre = forzado || (0, exports.proveedorActivo)();
    const modelo = modeloForzado || summit_1.SUMMIT_MODELS[nombre];
    return nombre === "fal" ? proveedorFal(modelo) : proveedorReplicate(modelo);
};
exports.obtenerProveedor = obtenerProveedor;
const esProveedorValido = (v) => v === "replicate" || v === "fal";
exports.esProveedorValido = esProveedorValido;
/**
 * Estado de una predicción de Replicate.
 *
 * Vive aquí y no en el servicio porque es lo único que NO se puede abstraer:
 * en fal.ai se usa el endpoint síncrono, que devuelve la imagen en la misma
 * petición y no deja ninguna predicción que consultar.
 */
const estadoReplicate = async (predictionId) => {
    const prediction = await clienteReplicate().predictions.get(predictionId);
    return {
        id: predictionId,
        status: prediction.status === "succeeded"
            ? "completed"
            : prediction.status === "failed"
                ? "failed"
                : "processing",
        imageUrl: prediction.output
            ? (Array.isArray(prediction.output)
                ? prediction.output[0]
                : prediction.output)
            : undefined,
        error: prediction.error?.toString(),
        createdAt: new Date(prediction.created_at),
        completedAt: prediction.completed_at
            ? new Date(prediction.completed_at)
            : undefined,
    };
};
exports.estadoReplicate = estadoReplicate;
//# sourceMappingURL=proveedores.js.map