import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UnidadesOrganicas from "./pages/UnidadesOrganicas";
import Professores from "./pages/Professores";
import Expedientes from "./pages/Expedientes";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import { AIAssistant } from "./components/AIAssistant";
import { CommandPalette } from "./components/CommandPalette";

// Lazy-loaded heavy / less-frequent pages
const Assiduidade = lazy(() => import("./pages/Assiduidade"));
const Horarios = lazy(() => import("./pages/Horarios"));
const Avaliacoes = lazy(() => import("./pages/Avaliacoes"));
const Processos = lazy(() => import("./pages/Processos"));
const Comunicados = lazy(() => import("./pages/Comunicados"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const GestaoUtilizadores = lazy(() => import("./pages/GestaoUtilizadores"));
const Provincias = lazy(() => import("./pages/Provincias"));
const Municipios = lazy(() => import("./pages/Municipios"));
const Alunos = lazy(() => import("./pages/Alunos"));
const PresencaOffline = lazy(() => import("./pages/PresencaOffline"));
const AuditHistory = lazy(() => import("./pages/AuditHistory"));
const Aprovacoes = lazy(() => import("./pages/Aprovacoes"));
const Transferencias = lazy(() => import("./pages/Transferencias"));
const RelatoriosOficiais = lazy(() => import("./pages/RelatoriosOficiais"));
const DeficitDocente = lazy(() => import("./pages/DeficitDocente"));
const VerifyDocument = lazy(() => import("./pages/VerifyDocument"));
const DocumentosEmitidos = lazy(() => import("./pages/DocumentosEmitidos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const ConsultaAgente = lazy(() => import("./pages/ConsultaAgente"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 60, // 60 days
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: 3,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key).then((v) => v ?? null),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: "sige-query-cache",
  throttleTime: 1000,
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 60, buster: "v1" }}
  >
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify/:code" element={<VerifyDocument />} />
              <Route path="/consulta" element={<ConsultaAgente />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/provincias" element={<ProtectedRoute><Provincias /></ProtectedRoute>} />
              <Route path="/municipios" element={<ProtectedRoute><Municipios /></ProtectedRoute>} />
              <Route path="/escolas" element={<ProtectedRoute><UnidadesOrganicas /></ProtectedRoute>} />
              <Route path="/unidades-organicas" element={<ProtectedRoute><UnidadesOrganicas /></ProtectedRoute>} />
              <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
              <Route path="/alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
              <Route path="/presencas" element={<ProtectedRoute><PresencaOffline /></ProtectedRoute>} />
              <Route path="/expedientes" element={<ProtectedRoute><Expedientes /></ProtectedRoute>} />
              <Route path="/aprovacoes" element={<ProtectedRoute><Aprovacoes /></ProtectedRoute>} />
              <Route path="/assiduidade" element={<ProtectedRoute><Assiduidade /></ProtectedRoute>} />
              <Route path="/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
              <Route path="/avaliacoes" element={<ProtectedRoute><Avaliacoes /></ProtectedRoute>} />
              <Route path="/processos" element={<ProtectedRoute><Processos /></ProtectedRoute>} />
              <Route path="/comunicados" element={<ProtectedRoute><Comunicados /></ProtectedRoute>} />
              <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              <Route path="/utilizadores" element={<ProtectedRoute><GestaoUtilizadores /></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute><AuditHistory /></ProtectedRoute>} />
              <Route path="/transferencias" element={<ProtectedRoute><Transferencias /></ProtectedRoute>} />
              <Route path="/relatorios-oficiais" element={<ProtectedRoute><RelatoriosOficiais /></ProtectedRoute>} />
              <Route path="/deficit" element={<ProtectedRoute><DeficitDocente /></ProtectedRoute>} />
              <Route path="/documentos-emitidos" element={<ProtectedRoute><DocumentosEmitidos /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <AIAssistant />
          <CommandPalette />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </PersistQueryClientProvider>
);

export default App;
