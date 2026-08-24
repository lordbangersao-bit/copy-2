/**
 * Target da aplicação (centralizado).
 *
 * Definido em build/runtime por `VITE_TARGET`:
 *   VITE_TARGET=web      → aplicação Web online (padrão)
 *   VITE_TARGET=pwa      → build instalável PWA
 *   VITE_TARGET=desktop  → futura build Windows (Tauri)
 *
 * Não usar `import.meta.env.VITE_TARGET` fora deste ficheiro.
 */
export type AppTarget = "web" | "pwa" | "desktop";

const RAW = (import.meta.env.VITE_TARGET ?? "web").toString().toLowerCase().trim();

export const APP_TARGET: AppTarget =
  RAW === "pwa" || RAW === "desktop" ? (RAW as AppTarget) : "web";

export const isWeb = () => APP_TARGET === "web";
export const isPwa = () => APP_TARGET === "pwa";
export const isDesktop = () => APP_TARGET === "desktop";

/** Web e PWA partilham as mesmas APIs de browser. */
export const isBrowserTarget = () => !isDesktop();

/** Service Worker apenas em web/pwa (nunca no desktop/Tauri). */
export const supportsServiceWorker = () => isBrowserTarget();

/**
 * URL pública base da aplicação (verificação de documentos, QR codes, links).
 * Configurável por `VITE_PUBLIC_APP_URL`; por omissão usa a origem actual,
 * preservando exactamente o comportamento anterior.
 */
export function publicAppUrl(): string {
  const configured = (import.meta.env.VITE_PUBLIC_APP_URL ?? "").toString().trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://sigeangola.lovable.app";
}

/** URL pública de verificação de um documento emitido. */
export function documentVerifyUrl(documentCode: string): string {
  return `${publicAppUrl()}/verify/${documentCode}`;
}
