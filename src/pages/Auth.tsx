import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Loader2, AlertCircle, ArrowLeft, Mail, Phone, Shield, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type AuthView = "login" | "signup" | "forgot-password" | "forgot-phone";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) setError(err.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
    setIsLoading(false);
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email || !z.string().email().safeParse(email).success) {
      setError("Introduza um email válido");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess("Email de recuperação enviado! Verifique a sua caixa de entrada.");
    } catch (err: any) {
      setError("Erro ao enviar email de recuperação. Tente novamente.");
    }
    setIsLoading(false);
  };

  const handleForgotPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const cleanPhone = phone.replace(/\s/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setError("Introduza um número de telefone válido");
      return;
    }

    setIsLoading(true);
    try {
      // Search for user by phone in professores table
      const fullPhone = cleanPhone.startsWith("+244") ? cleanPhone : `+244${cleanPhone}`;
      const { data: professor, error: searchError } = await supabase
        .from("professores")
        .select("email, nome")
        .eq("telefone", cleanPhone)
        .single();

      if (searchError || !professor?.email) {
        // Try with +244 prefix
        const { data: prof2 } = await supabase
          .from("professores")
          .select("email, nome")
          .eq("telefone", fullPhone)
          .single();

        if (!prof2?.email) {
          setError("Número de telefone não encontrado no sistema. Contacte o administrador.");
          setIsLoading(false);
          return;
        }
        // Found with prefix, send recovery to their email
        await supabase.auth.resetPasswordForEmail(prof2.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setSuccess(`Email de recuperação enviado para o email associado ao funcionário ${prof2.nome}. Verifique a caixa de entrada.`);
        setIsLoading(false);
        return;
      }

      await supabase.auth.resetPasswordForEmail(professor.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSuccess(`Email de recuperação enviado para o email associado ao funcionário ${professor.nome}. Verifique a caixa de entrada.`);
    } catch (err: any) {
      setError("Erro ao processar a recuperação. Tente novamente.");
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(215,65%,15%)] via-[hsl(215,55%,25%)] to-[hsl(160,50%,20%)] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <img
              src="/images/brasao-angola.png"
              alt="Brasão de Angola"
              className="h-16 w-16 object-contain drop-shadow-lg"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide">DMEN Gestor</h1>
              <p className="text-xs text-white/70 leading-tight max-w-[200px]">
                Direcção Municipal da Educação de Namacunde
              </p>
            </div>
            <img
              src="/images/governo-angola-logo.png"
              alt="Governo de Angola"
              className="h-16 w-16 object-contain drop-shadow-lg"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-4 w-4 text-white/50" />
            <p className="text-[11px] text-white/50 uppercase tracking-widest">
              Sistema de Gestão Educacional
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          {view === "login" && (
            <>
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-lg text-foreground">Aceder ao Sistema</CardTitle>
                <CardDescription>Insira as suas credenciais de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email institucional</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="utilizador@dmen.gov.ao"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A entrar...
                      </>
                    ) : (
                      "Entrar no Sistema"
                    )}
                  </Button>
                </form>

                {/* Recovery Options */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground mb-3">
                    Perdeu as credenciais de acesso?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => { resetState(); setView("forgot-password"); }}
                    >
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                      Recuperar por Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => { resetState(); setView("forgot-phone"); }}
                    >
                      <Phone className="mr-1.5 h-3.5 w-3.5" />
                      Recuperar por Telefone
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-center text-muted-foreground mt-4">
                  Apenas utilizadores autorizados. Contacte o administrador para obter credenciais.
                </p>
              </CardContent>
            </>
          )}

          {/* Forgot Password - Email */}
          {view === "forgot-password" && (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { resetState(); setView("login"); }}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg text-foreground">Recuperar por Email</CardTitle>
                    <CardDescription>Enviaremos um link de recuperação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="mb-4 border-secondary/50 bg-secondary/10">
                    <Mail className="h-4 w-4 text-secondary" />
                    <AlertDescription className="text-secondary">{success}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleForgotEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email registado</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A enviar...
                      </>
                    ) : (
                      "Enviar Link de Recuperação"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* Forgot Password - Phone */}
          {view === "forgot-phone" && (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { resetState(); setView("login"); }}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg text-foreground">Recuperar por Telefone</CardTitle>
                    <CardDescription>Localizamos a sua conta pelo número registado</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="mb-4 border-secondary/50 bg-secondary/10">
                    <Mail className="h-4 w-4 text-secondary" />
                    <AlertDescription className="text-secondary">{success}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleForgotPhone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-phone">Número de telefone</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-muted rounded-md border border-input text-sm text-muted-foreground min-w-[80px] justify-center">
                        🇦🇴 +244
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="recovery-phone"
                          type="tel"
                          placeholder="923 456 789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))}
                          required
                          disabled={isLoading}
                          className="pl-10"
                          maxLength={12}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      O número deve estar registado no sistema (cadastro de agentes)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A procurar...
                      </>
                    ) : (
                      "Localizar Conta e Recuperar"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="text-[10px] text-center text-white/30">
          © {new Date().getFullYear()} DMEN Gestor — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
