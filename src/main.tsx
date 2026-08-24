import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supportsServiceWorker } from "@/lib/platform";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker: apenas em produção, targets web/pwa, fora do preview/iframe.
// O vite-plugin-pwa está configurado com `injectRegister: null`, logo este é o
// único ponto de registo (sem duplicação).
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const host = window.location.hostname;
const isPreviewHost =
  host.includes("lovableproject.com") ||
  host.includes("lovableproject-dev.com") ||
  host.includes("id-preview--") ||
  host.includes("preview--");

const swDisabled = isPreviewHost || isInIframe || !supportsServiceWorker();

if (swDisabled) {
  navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
