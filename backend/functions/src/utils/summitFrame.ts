import * as fs from "fs/promises";
import sharp from "sharp";
import { SUMMIT_FRAME } from "../config/summit";
import { summitAssetPath } from "./summitAssets";

/**
 * Compone el retrato dentro del marco de Claro Tech Summit 2026.
 *
 * Es el mismo montaje que ve el visitante en la pantalla del kiosco, para que
 * lo que se descarga por QR sea exactamente lo que vio, con marca:
 *
 *   fondo negro
 *     + retrato recortado con la silueta orgánica (resultado-mascara.png)
 *     + marco decorativo encima (resultado-marco.png)
 *
 * El arte original guarda la silueta como transparencia BLANCA y el exterior
 * como transparencia NEGRA; prepare-summit-assets.py convierte esa diferencia
 * en la máscara opaca que se usa aquí.
 */

const { canvas, silhouette } = SUMMIT_FRAME;

/** Los dos archivos se leen una vez por instancia y se reutilizan. */
let assets: Promise<{ frame: Buffer; mask: Buffer }> | null = null;

const loadAssets = () => {
  if (assets) return assets;

  assets = (async () => {
    const [frame, fullMask] = await Promise.all([
      fs.readFile(summitAssetPath("resultado-marco.png")),
      fs.readFile(summitAssetPath("resultado-mascara.png")),
    ]);

    // La máscara viene del tamaño del lienzo completo; al retrato solo le
    // corresponde el recuadro de la silueta.
    const mask = await sharp(fullMask).extract(silhouette).png().toBuffer();

    return { frame, mask };
  })().catch((error) => {
    assets = null;
    throw error;
  });

  return assets;
};

export const composeSummitFrame = async (portrait: Buffer): Promise<Buffer> => {
  const { frame, mask } = await loadAssets();

  // `cover` recorta lo mínimo: el modelo entrega 3:4 (0.750) y la silueta pide
  // 965×1356 (0.711), así que solo se pierde un poco a los lados.
  const shaped = await sharp(portrait)
    .resize(silhouette.width, silhouette.height, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp({
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
    ])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
};
