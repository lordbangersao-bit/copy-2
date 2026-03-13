import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UnidadesOrganicas from "./pages/UnidadesOrganicas";
import Professores from "./pages/Professores";
import Expedientes from "./pages/Expedientes";
import Assiduidade from "./pages/Assiduidade";
import Horarios from "./pages/Horarios";
import Avaliacoes from "./pages/Avaliacoes";
import Processos from "./pages/Processos";
import Comunicados from "./pages/Comunicados";
import Documentos from "./pages/Documentos";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import GestaoUtilizadores from "./pages/GestaoUtilizadores";
import { AIAssistant } from "./components/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/escolas" element={<ProtectedRoute><UnidadesOrganicas /></ProtectedRoute>} />
            <Route path="/unidades-organicas" element={<ProtectedRoute><UnidadesOrganicas /></ProtectedRoute>} />
            <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
            <Route path="/expedientes" element={<ProtectedRoute><Expedientes /></ProtectedRoute>} />
            <Route path="/assiduidade" element={<ProtectedRoute><Assiduidade /></ProtectedRoute>} />
            <Route path="/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
            <Route path="/avaliacoes" element={<ProtectedRoute><Avaliacoes /></ProtectedRoute>} />
            <Route path="/processos" element={<ProtectedRoute><Processos /></ProtectedRoute>} />
            <Route path="/comunicados" element={<ProtectedRoute><Comunicados /></ProtectedRoute>} />
            <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
