import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, UserPlus, Users, ShieldCheck, ShieldAlert, Eye, Search, RefreshCw, UserCog, Lock } from "lucide-react";
import { Navigate } from "react-router-dom";

interface UserWithRole {
  user_id: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  active: boolean;
  created_at: string;
  id: string;
}

export default function GestaoUtilizadores() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Fetch all user roles
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserWithRole[];
    },
  });

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Estado do utilizador actualizado");
    },
    onError: () => {
      toast.error("Erro ao actualizar estado do utilizador");
    },
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "ADMIN" | "VIEWER" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Papel do utilizador actualizado");
    },
    onError: () => {
      toast.error("Erro ao actualizar papel do utilizador");
    },
  });

  // Create new user
  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      // Use edge function to create user (admin-only)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail, password: newPassword, role: newRole },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar utilizador");
      }

      toast.success(`Utilizador ${newEmail} criado com sucesso`);
      setNewEmail("");
      setNewPassword("");
      setNewRole("VIEWER");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar utilizador");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u as any).email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const viewerCount = users.filter((u) => u.role === "VIEWER").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Utilizadores"
          description="Registo de credenciais e gestão de acessos ao sistema"
          icon={UserCog}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total de Utilizadores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Utilizadores Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground">Administradores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{viewerCount}</p>
                <p className="text-xs text-muted-foreground">Visualizadores</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Credenciais de Acesso
                </CardTitle>
                <CardDescription>
                  Gerir utilizadores, papéis e permissões do sistema
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Utilizador
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Registar Novo Utilizador
                      </DialogTitle>
                      <DialogDescription>
                        Crie credenciais de acesso ao sistema DMEN Gestor
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="utilizador@dmen.gov.ao"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Papel no Sistema</Label>
                        <Select value={newRole} onValueChange={(v) => setNewRole(v as "ADMIN" | "VIEWER")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-amber-500" />
                                Administrador — Acesso total
                              </div>
                            </SelectItem>
                            <SelectItem value="VIEWER">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-500" />
                                Visualizador — Apenas leitura
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateUser} disabled={isCreating}>
                        {isCreating ? "A criar..." : "Criar Utilizador"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator className="mt-4" />
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ID de utilizador..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum utilizador encontrado</p>
                <p className="text-sm">Crie o primeiro utilizador do sistema</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">ID Utilizador</TableHead>
                      <TableHead className="font-semibold">Papel</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Data de Registo</TableHead>
                      <TableHead className="font-semibold text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              u.role === "ADMIN" ? "bg-amber-500/10" : "bg-blue-500/10"
                            }`}>
                              {u.role === "ADMIN" ? (
                                <Shield className="h-4 w-4 text-amber-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium font-mono">
                                {u.user_id.substring(0, 8)}...
                              </p>
                              {u.user_id === user?.id && (
                                <Badge variant="outline" className="text-[10px]">Você</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(v) => updateRoleMutation.mutate({ id: u.id, role: v as "ADMIN" | "VIEWER" })}
                            disabled={u.user_id === user?.id}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3 text-amber-500" />
                                  Administrador
                                </div>
                              </SelectItem>
                              <SelectItem value="VIEWER">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-3 w-3 text-blue-500" />
                                  Visualizador
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: u.id, active: checked })
                              }
                              disabled={u.user_id === user?.id}
                            />
                            <Badge
                              variant={u.active ? "default" : "secondary"}
                              className={u.active ? "bg-green-500/10 text-green-700 border-green-200" : ""}
                            >
                              {u.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-AO", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.user_id === user?.id ? (
                            <span className="text-xs text-muted-foreground italic">Sessão actual</span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                toggleActiveMutation.mutate({ id: u.id, active: !u.active });
                              }}
                            >
                              {u.active ? (
                                <>
                                  <ShieldAlert className="h-4 w-4 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
