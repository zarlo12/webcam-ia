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
exports.saveFeriaParticipante = void 0;
const admin = __importStar(require("firebase-admin"));
const feria_1 = require("../config/feria");
// storage.ts ya llama a initializeApp; se repite la guarda por si este módulo
// se carga primero.
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Guarda el registro del participante junto con las URLs de su foto.
 *
 * Nunca lanza: si Firestore falla, la imagen ya se generó y no queremos perderla
 * por un error de base de datos. Se registra en logs y sigue.
 */
const saveFeriaParticipante = async (data) => {
    try {
        const doc = await admin
            .firestore()
            .collection(feria_1.FERIA_COLLECTION)
            .add({
            ...data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            campaign: "antioquia-nos-ensena-a-llegar-lejos",
        });
        console.log(`[FERIA] 🗄️  Registro guardado en Firestore: ${doc.id}`);
        return doc.id;
    }
    catch (error) {
        console.error("[FERIA] ⚠️  No se pudo guardar el registro en Firestore:", error);
        return null;
    }
};
exports.saveFeriaParticipante = saveFeriaParticipante;
//# sourceMappingURL=feriaFirestore.js.map