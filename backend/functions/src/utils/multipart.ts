/**
 * Parser de multipart/form-data.
 *
 * Basado en el del controlador de circus (que sigue intacto porque está en
 * producción para otro proyecto), con dos correcciones:
 *
 *  1. El boundary se usa TAL CUAL viene en el content-type. El parser anterior le
 *     quitaba los guiones iniciales, y como el FormData del navegador genera
 *     boundaries que empiezan con "----", el delimitador real quedaba desalineado
 *     4 bytes: cada archivo salía con "\r\n--" pegado al final. Los JPEG lo
 *     toleran, así que el bug pasaba desapercibido, pero la foto llegaba corrupta.
 *  2. Los campos de texto ya no pasan por un replace agresivo de guiones (antes
 *     "Restrepo-" perdía el guión final). Ahora solo se quita el CRLF de cierre.
 */
export interface ParsedMultipart {
  fields: Record<string, string>;
  files: Record<string, Buffer>;
}

export function parseMultipartData(
  body: Buffer,
  boundary: string,
): ParsedMultipart {
  const fields: Record<string, string> = {};
  const files: Record<string, Buffer> = {};

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];

  let start = 0;
  let pos = body.indexOf(boundaryBuffer, start);

  while (pos !== -1) {
    if (start > 0) {
      parts.push(body.slice(start, pos));
    }
    start = pos + boundaryBuffer.length;
    pos = body.indexOf(boundaryBuffer, start);
  }

  parts.forEach((part) => {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const headers = part.slice(0, headerEnd).toString();
    const content = part.slice(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    if (!nameMatch) return;

    const fieldName = nameMatch[1];

    // Cada parte termina con el CRLF que precede al delimitador siguiente
    const value = content.subarray(0, content.length - 2);

    if (headers.includes("filename=")) {
      files[fieldName] = value;
    } else {
      fields[fieldName] = value.toString("utf8").trim();
    }
  });

  return { fields, files };
}

/** Lee el cuerpo crudo de la petición, venga como rawBody, body o stream. */
export function readRequestBody(req: any): Promise<Buffer> {
  if (req.rawBody) {
    return Promise.resolve(
      Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody),
    );
  }

  if (req.body && (Buffer.isBuffer(req.body) || typeof req.body === "string")) {
    return Promise.resolve(
      Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body),
    );
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Extrae el boundary del header content-type.
 *
 * Se devuelve el token completo, con sus guiones: el delimitador real dentro del
 * cuerpo es "--" + token, y los boundaries del navegador ya empiezan con "----".
 */
export function getBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return null;
  return (match[1] || match[2]).trim() || null;
}

/** Detecta el mime type real a partir de los primeros bytes. */
export function detectImageMime(buffer: Buffer): string {
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (buffer.slice(0, 8).equals(pngSignature)) return "image/png";
  if (buffer.slice(0, 4).toString("ascii") === "RIFF") return "image/webp";
  return "image/jpeg";
}
