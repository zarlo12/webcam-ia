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
exports.guardarPosterEnChat = exports.CHAT_COLLECTION = void 0;
const admin = __importStar(require("firebase-admin"));
// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Puente con el agente de chat (proyecto chatgpt-claro-media).
 *
 * El chat vive en Vercel y este kiosco en Firebase Hosting, pero los dos
 * escriben en el MISMO proyecto de Firebase y en la misma colección. Cuando el
 * visitante llega desde una propuesta, el chat le pasa el ID de su documento
 * por la URL y el póster se guarda ahí, no en un registro aparte: así queda un
 * solo expediente por persona —propuesta y foto juntas— y el panel del chat lo
 * ve sin tener que cruzar nada.
 */
exports.CHAT_COLLECTION = "ClaroMediaAgenteIA";
/**
 * Añade el póster al documento de la conversación.
 *
 * Nunca lanza: el póster ya está generado y guardado en Storage, y perderlo
 * por un fallo de escritura sería absurdo.
 *
 * Se comprueba que el documento exista ANTES de escribir. El ID llega de la
 * barra de direcciones, así que puede venir mal escrito, recortado o apuntar a
 * una conversación ya borrada; con `set({merge:true})` a secas, cada uno de
 * esos casos crearía un documento huérfano que luego aparece en el panel del
 * chat como un registro sin nombre ni propuesta.
 *
 * `update` dentro de una transacción sería la alternativa, pero leer y escribir
 * por separado basta: si la conversación se borrara justo entre las dos, lo
 * único que se pierde es el enlace del póster, que igual queda en el registro
 * propio del kiosco.
 */
const guardarPosterEnChat = async (docId, poster) => {
    try {
        const ref = admin.firestore().collection(exports.CHAT_COLLECTION).doc(docId);
        if (!(await ref.get()).exists) {
            console.warn(`[DATATECH] ⚠️  La conversación ${docId} no existe; el póster queda solo en el registro del kiosco.`);
            return false;
        }
        await ref.update({
            fotografiaIA: {
                ...poster,
                generadoEn: admin.firestore.Timestamp.now(),
            },
            ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[DATATECH] 🔗 Póster guardado en la conversación ${docId}`);
        return true;
    }
    catch (error) {
        console.error(`[DATATECH] ⚠️  No se pudo guardar el póster en la conversación ${docId}:`, error);
        return false;
    }
};
exports.guardarPosterEnChat = guardarPosterEnChat;
//# sourceMappingURL=chatAgente.js.map