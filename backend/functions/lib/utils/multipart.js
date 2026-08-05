"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipartData = parseMultipartData;
exports.readRequestBody = readRequestBody;
exports.getBoundary = getBoundary;
exports.detectImageMime = detectImageMime;
function parseMultipartData(body, boundary) {
    const fields = {};
    const files = {};
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
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
        if (headerEnd === -1)
            return;
        const headers = part.slice(0, headerEnd).toString();
        const content = part.slice(headerEnd + 4);
        const nameMatch = headers.match(/name="([^"]+)"/);
        if (!nameMatch)
            return;
        const fieldName = nameMatch[1];
        // Cada parte termina con el CRLF que precede al delimitador siguiente
        const value = content.subarray(0, content.length - 2);
        if (headers.includes("filename=")) {
            files[fieldName] = value;
        }
        else {
            fields[fieldName] = value.toString("utf8").trim();
        }
    });
    return { fields, files };
}
/** Lee el cuerpo crudo de la petición, venga como rawBody, body o stream. */
function readRequestBody(req) {
    if (req.rawBody) {
        return Promise.resolve(Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody));
    }
    if (req.body && (Buffer.isBuffer(req.body) || typeof req.body === "string")) {
        return Promise.resolve(Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body));
    }
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
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
function getBoundary(contentType) {
    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!match)
        return null;
    return (match[1] || match[2]).trim() || null;
}
/** Detecta el mime type real a partir de los primeros bytes. */
function detectImageMime(buffer) {
    const pngSignature = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (buffer.slice(0, 8).equals(pngSignature))
        return "image/png";
    if (buffer.slice(0, 4).toString("ascii") === "RIFF")
        return "image/webp";
    return "image/jpeg";
}
//# sourceMappingURL=multipart.js.map