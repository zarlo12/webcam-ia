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
exports.getPlantillaUrl = exports.datatechAssetPath = void 0;
const path = __importStar(require("path"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const datatech_1 = require("../config/datatech");
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
const datatechAssetPath = (filename) => path.join(DIR, filename);
exports.datatechAssetPath = datatechAssetPath;
const bucket = admin.storage().bucket(config_1.firebaseConfig.bucketName);
/** Una URL por archivo; se resuelve una vez por instancia de la función. */
const publicadas = new Map();
const publicar = async (filename) => {
    const ruta = `${datatech_1.DATATECH_STORAGE.templates}/${filename}`;
    const file = bucket.file(ruta);
    const [existe] = await file.exists();
    if (!existe) {
        console.log(`[DATATECH] 📎 Publicando plantilla: ${ruta}`);
        await bucket.upload((0, exports.datatechAssetPath)(filename), {
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
const getPlantillaUrl = (filename) => {
    const cacheada = publicadas.get(filename);
    if (cacheada)
        return cacheada;
    // Se cachea la promesa, no el resultado: dos peticiones simultáneas de la
    // misma plantilla comparten una sola subida.
    const pendiente = publicar(filename).catch((error) => {
        publicadas.delete(filename);
        throw error;
    });
    publicadas.set(filename, pendiente);
    return pendiente;
};
exports.getPlantillaUrl = getPlantillaUrl;
//# sourceMappingURL=datatechAssets.js.map