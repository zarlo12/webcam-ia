import * as path from "path";
import * as admin from "firebase-admin";
import { firebaseConfig } from "../config";
import { DATATECH_STORAGE } from "../config/datatech";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Plantillas que viajan dentro del paquete de la función.
 *
 * __dirname apunta a lib/utils en producción y a src/utils al compilar en
 * local; en los dos casos subir dos niveles cae en backend/functions/.
 */
const DIR = path.resolve(__dirname, "..", "..", "assets", "datatech");

export const datatechAssetPath = (filename: string): string =>
  path.join(DIR, filename);

const bucket = admin.storage().bucket(firebaseConfig.bucketName);

/** Una URL por archivo; se resuelve una vez por instancia de la función. */
const publicadas = new Map<string, Promise<string>>();

const publicar = async (filename: string): Promise<string> => {
  const ruta = `${DATATECH_STORAGE.templates}/${filename}`;
  const file = bucket.file(ruta);
  const [existe] = await file.exists();

  if (!existe) {
    console.log(`[DATATECH] 📎 Publicando plantilla: ${ruta}`);
    await bucket.upload(datatechAssetPath(filename), {
      destination: ruta,
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    await file.makePublic();
  }

  return `https://storage.googleapis.com/${bucket.name}/${ruta}`;
};

/**
 * URL pública de la plantilla de un póster.
 *
 * El proveedor de IA necesita leer la imagen por HTTP, así que la primera vez
 * que se usa una plantilla se sube el archivo que vino en el paquete. Así no
 * hay que acordarse de subir nada a mano: basta correr
 * scripts/prepare-datatech-assets.py y desplegar. Si cambia un arte, hay que
 * borrar el objeto viejo de Storage para que se vuelva a publicar.
 */
export const getPlantillaUrl = (filename: string): Promise<string> => {
  const cacheada = publicadas.get(filename);
  if (cacheada) return cacheada;

  // Se cachea la promesa, no el resultado: dos peticiones simultáneas de la
  // misma plantilla comparten una sola subida.
  const pendiente = publicar(filename).catch((error) => {
    publicadas.delete(filename);
    throw error;
  });

  publicadas.set(filename, pendiente);
  return pendiente;
};
