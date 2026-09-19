"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStyleReferenceUrl = exports.summitAssetPath = exports.SUMMIT_ASSETS_DIR = void 0;
const path = __importStar(require("path"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const summit_1 = require("../config/summit");
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
exports.SUMMIT_ASSETS_DIR = path.resolve(__dirname, "..", "..", "assets", "summit");
const summitAssetPath = (filename) => path.join(exports.SUMMIT_ASSETS_DIR, filename);
exports.summitAssetPath = summitAssetPath;
const bucket = admin.storage().bucket(config_1.firebaseConfig.bucketName);
/** Una URL por archivo; se resuelve una vez por instancia de la función. */
const publishedReferences = new Map();
const publish = async (filename) => {
    const storagePath = `${summit_1.SUMMIT_STORAGE.references}/${filename}`;
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
        console.log(`[SUMMIT] 📎 Publicando referencia de estilo: ${storagePath}`);
        await bucket.upload((0, exports.summitAssetPath)(filename), {
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
const getStyleReferenceUrl = (filename) => {
    const cached = publishedReferences.get(filename);
    if (cached)
        return cached;
    // Se cachea la promesa, no el resultado: dos peticiones simultáneas del mismo
    // filtro comparten una sola subida.
    const pending = publish(filename).catch((error) => {
        publishedReferences.delete(filename);
        throw error;
    });
    publishedReferences.set(filename, pending);
    return pending;
};
exports.getStyleReferenceUrl = getStyleReferenceUrl;
//# sourceMappingURL=summitAssets.js.map