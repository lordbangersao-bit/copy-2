/**
 * Camada de abstração de plataforma.
 *
 * WEB/PWA  → APIs Web actuais (comportamento inalterado).
 * DESKTOP  → interfaces preparadas para futura implementação Tauri
 *            (impressão nativa, diálogo de gravação, notificações do SO,
 *             abertura de links no browser do sistema).
 *
 * Nota Desktop (offline): a persistência actual (React Query + IndexedDB +
 * offlineFirst + fila de mutações) continua válida numa WebView Tauri; a
 * futura versão Desktop precisará apenas de tratamento específico para
 * gravação de ficheiros, impressão e notificações — ver TODOs abaixo.
 */
import {
  APP_TARGET,
  isDesktop,
  isPwa,
  isWeb,
  isBrowserTarget,
  supportsServiceWorker,
  publicAppUrl,
  documentVerifyUrl,
  type AppTarget,
} from "./target";

export {
  APP_TARGET,
  isDesktop,
  isPwa,
  isWeb,
  isBrowserTarget,
  supportsServiceWorker,
  publicAppUrl,
  documentVerifyUrl,
};
export type { AppTarget };

export interface PrintDocumentOptions {
  /** HTML completo do documento a imprimir. */
  html: string;
  /** Título/janela (usado apenas informativamente). */
  title?: string;
  /** Atraso antes de disparar a impressão (ms). */
  delay?: number;
}

export interface SaveFileOptions {
  filename: string;
  mime: string;
  data: BlobPart;
}

export interface NotifyOptions {
  title: string;
  body?: string;
}

export interface PlatformAdapter {
  target: AppTarget;
  /** Abre a janela de impressão com o HTML fornecido (A4 preservado). */
  print(options: PrintDocumentOptions): void;
  copyToClipboard(text: string): Promise<boolean>;
  saveFile(options: SaveFileOptions): Promise<void>;
  requestNotificationPermission(): Promise<NotificationPermission>;
  notificationPermission(): NotificationPermission;
  notify(options: NotifyOptions): Promise<boolean>;
  openExternal(url: string, target?: string): void;
}

// ------------------------------------------------------------------
// WEB / PWA
// ------------------------------------------------------------------

function webPrint({ html, delay = 700 }: PrintDocumentOptions) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    try {
      printWindow.print();
    } catch {
      /* noop */
    }
  }, delay);
}

async function webCopyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function webSaveFile({ data, filename, mime }: SaveFileOptions): Promise<void> {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function webNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

async function webRequestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return Notification.requestPermission();
}

async function webNotify({ title, body }: NotifyOptions): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  new Notification(title, body ? { body } : undefined);
  return true;
}

function webOpenExternal(url: string, target = "_blank") {
  window.open(url, target, "noopener,noreferrer");
}

const webPlatform: PlatformAdapter = {
  target: APP_TARGET,
  print: webPrint,
  copyToClipboard: webCopyToClipboard,
  saveFile: webSaveFile,
  requestNotificationPermission: webRequestNotificationPermission,
  notificationPermission: webNotificationPermission,
  notify: webNotify,
  openExternal: webOpenExternal,
};

// ------------------------------------------------------------------
// DESKTOP (Tauri) — interfaces preparadas, sem dependências instaladas
// ------------------------------------------------------------------

const desktopPlatform: PlatformAdapter = {
  ...webPlatform,
  target: "desktop",
  // TODO(tauri): usar a janela de impressão nativa da WebView.
  print: webPrint,
  // TODO(tauri): @tauri-apps/plugin-clipboard-manager
  copyToClipboard: webCopyToClipboard,
  // TODO(tauri): @tauri-apps/plugin-dialog (save) + plugin-fs (writeFile)
  saveFile: webSaveFile,
  // TODO(tauri): @tauri-apps/plugin-notification
  requestNotificationPermission: webRequestNotificationPermission,
  notify: webNotify,
  // TODO(tauri): @tauri-apps/plugin-opener (abrir no browser do sistema)
  openExternal: webOpenExternal,
};

export const platform: PlatformAdapter = isDesktop() ? desktopPlatform : webPlatform;

export default platform;
