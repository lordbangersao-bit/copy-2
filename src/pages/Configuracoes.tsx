import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Settings, Moon, Sun, LogOut, Mail, Shield, Clock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador Provincial",
  GESTOR_PROVINCIAL: "Administrador Provincial",
  VALIDADOR_PROVINCIAL: "Director Municipal",
  GESTOR_MUNICIPAL: "Gestor Municipal",
  DIRECTOR_ESCOLA: "Gestor da Unidade Orgânica",
  TECNICO: "Operador",
  VIEWER: "Consulta",
  AUDITOR: "Auditoria e Conformidade",
};

export default function Configuracoes() {
  const { user, role, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) toast.error("Não foi possível enviar o e-mail de redefinição");
    else toast.success("Enviado e-mail para redefinir a palavra-passe");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Configurações"
          description="Preferências da conta, segurança e aparência"
          icon={<Settings className="h-6 w-6" />}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Perfil Institucional
            </CardTitle>
            <CardDescription>Informações da sua conta no SIGE+</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Papel: </span>
                <Badge variant="secondary">{roleLabels[role || ""] || "Sem papel"}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                ID da sessão: <span className="font-mono text-xs">{user?.id?.slice(0, 8)}…</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Aparência
            </CardTitle>
            <CardDescription>Tema da interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Modo {isDark ? "escuro" : "claro"}</p>
                <p className="text-xs text-muted-foreground">
                  Alternar entre interface clara e escura
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsDark((v) => !v)}>
                {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDark ? "Modo claro" : "Modo escuro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Segurança
            </CardTitle>
            <CardDescription>Sessão e palavra-passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Por motivos de segurança, a sessão termina automaticamente após
                <strong className="text-foreground"> 3 minutos </strong> de inactividade.
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-sm">Redefinir palavra-passe</p>
                <p className="text-xs text-muted-foreground">
                  Enviaremos um link para o seu e-mail institucional
                </p>
              </div>
              <Button variant="outline" onClick={handlePasswordReset} disabled={sendingReset}>
                {sendingReset ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                Enviar link
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Terminar sessão</p>
                <p className="text-xs text-muted-foreground">Sair da conta neste dispositivo</p>
              </div>
              <Button variant="destructive" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" /> Terminar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre o SIGE+</CardTitle>
            <CardDescription>Sistema Integrado de Gestão da Educação</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Versão institucional — Município de Namacunde, Província do Cunene.</p>
            <p className="text-xs">
              Criado por <span className="font-semibold">Áureo Chissanhino Maria da Silva</span> — Advogado e Codificador Informático.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
