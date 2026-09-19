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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeSummitFrame = void 0;
const fs = __importStar(require("fs/promises"));
const sharp_1 = __importDefault(require("sharp"));
const summit_1 = require("../config/summit");
const summitAssets_1 = require("./summitAssets");
/**
 * Compone el retrato dentro del marco de Claro Tech Summit 2026.
 *
 * Es el mismo montaje que ve el visitante en la pantalla del kiosco, para que
 * lo que se descarga por QR sea exactamente lo que vio, con marca:
 *
 *   fondo negro
 *     + retrato recortado con la silueta orgánica (resultado-mascara.png)
 *     + marco decorativo encima (resultado-marco.png)
 *     + los dos logos en las esquinas superiores
 *
 * El arte original guarda la silueta como transparencia BLANCA y el exterior
 * como transparencia NEGRA; prepare-summit-assets.py convierte esa diferencia
 * en la máscara opaca que se usa aquí.
 */
const { canvas, silhouette, logos } = summit_1.SUMMIT_FRAME;
/** Todo se prepara una vez por instancia y se reutiliza en cada petición. */
let assets = null;
/**
 * Escala el logo al ancho pedido y calcula dónde va.
 *
 * El alto sale de la proporción del archivo, así que cambiar un logo por otro
 * de distinta forma no descuadra nada: solo hay que revisar el `width`.
 */
const prepareLogo = async (spec, side) => {
    const buffer = await (0, sharp_1.default)((0, summitAssets_1.summitAssetPath)(spec.file))
        .resize({ width: spec.width })
        .png()
        .toBuffer();
    const { width = spec.width } = await (0, sharp_1.default)(buffer).metadata();
    return {
        buffer,
        left: side === "left" ? spec.margin.x : canvas.width - width - spec.margin.x,
        top: spec.margin.y,
    };
};
const loadAssets = () => {
    if (assets)
        return assets;
    assets = (async () => {
        const [frame, fullMask, leftLogo, rightLogo] = await Promise.all([
            fs.readFile((0, summitAssets_1.summitAssetPath)("resultado-marco.png")),
            fs.readFile((0, summitAssets_1.summitAssetPath)("resultado-mascara.png")),
            prepareLogo(logos.left, "left"),
            prepareLogo(logos.right, "right"),
        ]);
        // La máscara viene del tamaño del lienzo completo; al retrato solo le
        // corresponde el recuadro de la silueta.
        const mask = await (0, sharp_1.default)(fullMask).extract(silhouette).png().toBuffer();
        return { frame, mask, leftLogo, rightLogo };
    })().catch((error) => {
        assets = null;
        throw error;
    });
    return assets;
};
const composeSummitFrame = async (portrait) => {
    const { frame, mask, leftLogo, rightLogo } = await loadAssets();
    // `cover` recorta lo mínimo: el modelo entrega 3:4 (0.750) y la silueta pide
    // 965×1356 (0.711), así que solo se pierde un poco a los lados.
    const shaped = await (0, sharp_1.default)(portrait)
        .resize(silhouette.width, silhouette.height, { fit: "cover" })
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer();
    return (0, sharp_1.default)({
        create: {
            width: canvas.width,
            height: canvas.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
    })
        .composite([
        { input: shaped, left: silhouette.left, top: silhouette.top },
        { input: frame, left: 0, top: 0 },
        { input: leftLogo.buffer, left: leftLogo.left, top: leftLogo.top },
        { input: rightLogo.buffer, left: rightLogo.left, top: rightLogo.top },
    ])
        .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
        .toBuffer();
};
exports.composeSummitFrame = composeSummitFrame;
//# sourceMappingURL=summitFrame.js.map