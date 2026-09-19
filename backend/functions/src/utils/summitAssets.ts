import * as path from "path";
import * as admin from "firebase-admin";
import { firebaseConfig } from "../config";
import { SUMMIT_STORAGE } from "../config/summit";

// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Artes que viajan dentro del paquete de la función.
 *
 * __dirname apunta a lib/utils en producción y a src/utils al compilar en
 * local; en los dos casos subir dos niveles cae en backend/functions/.
 */
export const SUMMIT_ASSETS_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "assets",
  "summit",
);

export const summitAssetPath = (filename: string): string =>
  path.join(SUMMIT_ASSETS_DIR, filename);

const bucket = admin.storage().bucket(firebaseConfig.bucketName);

/** Una URL por archivo; se resuelve una vez por instancia de la función. */
const publishedReferences = new Map<string, Promise<string>>();

const publish = async (filename: string): Promise<string> => {
  const storagePath = `${SUMMIT_STORAGE.references}/${filename}`;
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();

  if (!exists) {
    console.log(`[SUMMIT] 📎 Publicando referencia de estilo: ${storagePath}`);
    await bucket.upload(summitAssetPath(filename), {
      destination: storagePath,
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    await file.makePublic();
  }

  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
};

/**
 * URL pública de la referencia de estilo de un filtro.
 *
 * Replicate necesita leer la imagen por HTTP, así que la primera vez que se usa
 * un filtro se sube el archivo que vino en el paquete. Así no hay que acordarse
 * de subir plantillas a mano cuando diseño entrega artes nuevos: basta correr
 * scripts/prepare-summit-assets.py, desplegar y borrar el objeto viejo de
 * Storage si cambió el arte.
 */
export const getStyleReferenceUrl = (filename: string): Promise<string> => {
  const cached = publishedReferences.get(filename);
  if (cached) return cached;

  // Se cachea la promesa, no el resultado: dos peticiones simultáneas del mismo
  // filtro comparten una sola subida.
  const pending = publish(filename).catch((error) => {
    publishedReferences.delete(filename);
    throw error;
  });

  publishedReferences.set(filename, pending);
  return pending;
};
