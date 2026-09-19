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
 *     + los dos logos en las esquinas superiores
 *
 * El arte original guarda la silueta como transparencia BLANCA y el exterior
 * como transparencia NEGRA; prepare-summit-assets.py convierte esa diferencia
 * en la máscara, que además engorda un poco y le difumina el borde.
 *
 * El retrato entra con `contain` sobre el lienzo completo, no recortado a la
 * caja de la silueta: así se respeta el encuadre que compuso el modelo —que ya
 * viene en 3:4, la misma proporción larga del lienzo— y la máscara, que es del
 * tamaño del lienzo, cae siempre por dentro. Recortarlo a la caja obligaba a
 * ampliar la imagen y le comía la cabeza por arriba.
 */

const { canvas, logos } = SUMMIT_FRAME;

interface Assets {
  frame: Buffer;
  mask: Buffer;
  leftLogo: { buffer: Buffer; left: number; top: number };
  rightLogo: { buffer: Buffer; left: number; top: number };
}

/** Todo se prepara una vez por instancia y se reutiliza en cada petición. */
let assets: Promise<Assets> | null = null;

/**
 * Escala el logo al ancho pedido y calcula dónde va.
 *
 * El alto sale de la proporción del archivo, así que cambiar un logo por otro
 * de distinta forma no descuadra nada: solo hay que revisar el `width`.
 */
const prepareLogo = async (
  spec: { file: string; width: number; margin: { x: number; y: number } },
  side: "left" | "right",
) => {
  const buffer = await sharp(summitAssetPath(spec.file))
    .resize({ width: spec.width })
    .png()
    .toBuffer();

  const { width = spec.width } = await sharp(buffer).metadata();

  return {
    buffer,
    left: side === "left" ? spec.margin.x : canvas.width - width - spec.margin.x,
    top: spec.margin.y,
  };
};

const loadAssets = (): Promise<Assets> => {
  if (assets) return assets;

  assets = (async () => {
    const [frame, mask, leftLogo, rightLogo] = await Promise.all([
      fs.readFile(summitAssetPath("resultado-marco.png")),
      fs.readFile(summitAssetPath("resultado-mascara.png")),
      prepareLogo(logos.left, "left"),
      prepareLogo(logos.right, "right"),
    ]);

    return { frame, mask, leftLogo, rightLogo };
  })().catch((error) => {
    assets = null;
    throw error;
  });

  return assets;
};

export const composeSummitFrame = async (portrait: Buffer): Promise<Buffer> => {
  const { frame, mask, leftLogo, rightLogo } = await loadAssets();

  const shaped = await sharp(portrait)
    .resize(canvas.width, canvas.height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
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
      { input: shaped, left: 0, top: 0 },
      { input: frame, left: 0, top: 0 },
      { input: leftLogo.buffer, left: leftLogo.left, top: leftLogo.top },
      { input: rightLogo.buffer, left: rightLogo.left, top: rightLogo.top },
    ])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
};
