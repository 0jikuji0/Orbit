export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Types affichables dans le navigateur sans risque (pas de SVG ni de HTML : risque XSS). */
const INLINE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

export function isInlineMime(mime: string) {
  return INLINE_MIME.has(mime);
}

export function isImageMime(mime: string) {
  return INLINE_MIME.has(mime) && mime.startsWith("image/");
}

/** Nom de fichier affichable : sans chemin, sans caractères de contrôle, 200 caractères max. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f"]/g, "").trim();
  return clean.slice(0, 200) || "fichier";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
