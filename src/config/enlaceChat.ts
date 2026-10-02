/**
 * Enlace con el agente de chat (proyecto chatgpt-claro-media).
 *
 * Son dos aplicaciones desplegadas por separado —el chat en Vercel, este
 * kiosco en Firebase Hosting— pero comparten el mismo proyecto de Firebase
 * (imagen-ia-845a3) y la misma colección, `ClaroMediaAgenteIA`.
 *
 * El puente es el ID del documento, que el chat pasa por la URL:
 *
 *     https://claro-datatech.web.app/?doc=<idDeFirestore>&stand=A
 *
 * Cuando ese `doc` viene:
 *   · no se pide el correo — el chat ya lo tiene,
 *   · el póster se escribe en ESE MISMO documento,
 *   · al terminar se vuelve al chat en lugar de reiniciar aquí.
 *
 * Sin `doc`, el kiosco funciona solo, como hasta ahora.
 */

const CHAT_URL =
  import.meta.env.VITE_CHAT_URL || "https://chatgpt-claro-media.vercel.app";

export interface EnlaceChat {
  /** ID del documento en ClaroMediaAgenteIA, si se entró desde el chat. */
  docId: string | null;
  /** Stand de origen ("A" o "B"), para volver al mismo. */
  standId: string | null;
}

/**
 * Lee los parámetros una sola vez, al cargar.
 *
 * No se reactiva: en un kiosco la URL no cambia durante la sesión, y leerla en
 * cada render invitaría a estados inconsistentes a mitad de flujo.
 */
export const enlaceChat: EnlaceChat = (() => {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get("doc")?.trim() || null;
  const standId = params.get("stand")?.trim() || null;

  if (docId) {
    console.log(`🔗 Entrada desde el chat · doc ${docId} · stand ${standId ?? "—"}`);
  }

  return { docId, standId };
})();

/** True si el visitante llegó desde una propuesta del chat. */
export const vieneDelChat = (): boolean => enlaceChat.docId !== null;

/** URL para regresar al chat y empezar una propuesta nueva. */
export const urlVolverAlChat = (): string => {
  const url = new URL(CHAT_URL);
  if (enlaceChat.standId) url.searchParams.set("stand", enlaceChat.standId);
  return url.toString();
};

/** Sale del kiosco hacia el chat. */
export const volverAlChat = (): void => {
  window.location.href = urlVolverAlChat();
};
