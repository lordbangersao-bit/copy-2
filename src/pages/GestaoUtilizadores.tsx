import { useState } from "react";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProvinces } from "@/hooks/useProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useEscolas } from "@/hooks/useEscolas";
import { AppLayout } from "@/components/layout/AppLayout";
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
import { Shield, UserPlus, Users, ShieldCheck, Eye, Search, RefreshCw, UserCog, Lock, Map, MapPin, Building2, Pencil } from "lucide-react";
import { Navigate } from "react-router-dom";

const ALL_ROLES: { value: string; label: string; description: string }[] = [
  { value: "ADMIN", label: "Administrador", description: "Acesso total ao sistema" },
  { value: "GESTOR_PROVINCIAL", label: "Gestor Provincial", description: "Gere toda a província" },
  { value: "GESTOR_MUNICIPAL", label: "Gestor Municipal", description: "Gere o seu município" },
  { value: "DIRECTOR_ESCOLA", label: "Director de Escola", description: "Gere a sua escola" },
  { value: "TECNICO", label: "Técnico", description: "Leitura + acções limitadas" },
  { value: "VIEWER", label: "Visualizador", description: "Apenas leitura" },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-amber-500/10 text-amber-700 border-amber-200",
  GESTOR_PROVINCIAL: "bg-purple-500/10 text-purple-700 border-purple-200",
  GESTOR_MUNICIPAL: "bg-blue-500/10 text-blue-700 border-blue-200",
  DIRECTOR_ESCOLA: "bg-green-500/10 text-green-700 border-green-200",
  TECNICO: "bg-orange-500/10 text-orange-700 border-orange-200",
  VIEWER: "bg-gray-500/10 text-gray-700 border-gray-200",
};

function roleNeedsProvince(role: string) {
  return ["GESTOR_PROVINCIAL", "GESTOR_MUNICIPAL", "DIRECTOR_ESCOLA", "TECNICO"].includes(role);
}
function roleNeedsMunicipality(role: string) {
  return ["GESTOR_MUNICIPAL", "DIRECTOR_ESCOLA", "TECNICO"].includes(role);
}
function roleNeedsSchool(role: string) {
  return ["DIRECTOR_ESCOLA", "TECNICO"].includes(role);
}

export default function GestaoUtilizadores() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: provinces } = useProvinces();
  const { data: allMunicipalities } = useMunicipalities();
  const { data: escolas } = useEscolas();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("VIEWER");
  const [newProvinceId, setNewProvinceId] = useState("");
  const [newMunicipalityId, setNewMunicipalityId] = useState("");
  const [newSchoolId, setNewSchoolId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit hierarchy dialog
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState("");
  const [editProvinceId, setEditProvinceId] = useState("");
  const [editMunicipalityId, setEditMunicipalityId] = useState("");
  const [editSchoolId, setEditSchoolId] = useState("");

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("user_roles").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-roles"] }); toast.success("Estado actualizado"); },
    onError: () => toast.error("Erro ao actualizar"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role, province_id, municipality_id, school_id }: {
      id: string; role: string; province_id?: string | null; municipality_id?: string | null; school_id?: string | null;
    }) => {
      const update: Record<string, unknown> = { 
        role,
        province_id: province_id || null,
        municipality_id: municipality_id || null,
        school_id: school_id || null,
      };
      const { error } = await supabase.from("user_roles").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-roles"] }); toast.success("Papel e âmbito actualizados"); },
    onError: () => toast.error("Erro ao actualizar"),
  });

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) { toast.error("Preencha todos os campos"); return; }
    if (newPassword.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    if (roleNeedsProvince(newRole) && !newProvinceId) { toast.error("Selecione a província para este papel"); return; }
    if (roleNeedsMunicipality(newRole) && !newMunicipalityId) { toast.error("Selecione o município ao qual o utilizador ficará vinculado"); return; }
    if (roleNeedsSchool(newRole) && !newSchoolId) { toast.error("Selecione a escola para este papel"); return; }

    setIsCreating(true);
    try {
      const body: Record<string, unknown> = { email: newEmail, password: newPassword, role: newRole };
      if (newProvinceId) body.province_id = newProvinceId;
      if (newMunicipalityId) body.municipality_id = newMunicipalityId;
      if (newSchoolId) body.school_id = newSchoolId;

      const response = await supabase.functions.invoke("admin-create-user", { body });
      if (response.error) throw new Error(response.error.message);

      toast.success(`Utilizador ${newEmail} criado`);
      setNewEmail(""); setNewPassword(""); setNewRole("VIEWER");
      setNewProvinceId(""); setNewMunicipalityId(""); setNewSchoolId("");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar utilizador");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (u: any) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditProvinceId(u.province_id || "");
    setEditMunicipalityId(u.municipality_id || "");
    setEditSchoolId(u.school_id || "");
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    updateRoleMutation.mutate({
      id: editUser.id,
      role: editRole,
      province_id: editProvinceId || null,
      municipality_id: editMunicipalityId || null,
      school_id: editSchoolId || null,
    }, { onSuccess: () => setEditUser(null) });
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  const filteredUsers = users.filter(u => u.user_id?.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Create dialog filters
  const createFilteredMunicipalities = newProvinceId ? allMunicipalities?.filter(m => m.province_id === newProvinceId) : allMunicipalities;
  const createFilteredSchools = newMunicipalityId ? escolas?.filter(e => e.municipality_id === newMunicipalityId) : [];

  // Edit dialog filters
  const editFilteredMunicipalities = editProvinceId ? allMunicipalities?.filter(m => m.province_id === editProvinceId) : allMunicipalities;
  const editFilteredSchools = editMunicipalityId ? escolas?.filter(e => e.municipality_id === editMunicipalityId) : [];

  const getProvinceName = (id: string | null) => id ? provinces?.find(p => p.id === id)?.name : null;
  const getMunicipalityName = (id: string | null) => id ? allMunicipalities?.find(m => m.id === id)?.name : null;
  const getSchoolName = (id: string | null) => id ? escolas?.find(e => e.id === id)?.nome : null;

  const renderHierarchySelects = (
    role: string,
    provinceId: string, setProvince: (v: string) => void,
    municipalityId: string, setMunicipality: (v: string) => void,
    schoolId: string, setSchool: (v: string) => void,
    filteredMuns: any[] | undefined,
    filteredSchls: any[] | undefined
  ) => (
    <>
      {roleNeedsProvince(role) && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Map className="h-3.5 w-3.5" />Província</Label>
          <Select value={provinceId} onValueChange={v => { setProvince(v); setMunicipality(""); setSchool(""); }}>
            <SelectTrigger><SelectValue placeholder="Selecione a província..." /></SelectTrigger>
            <SelectContent>{provinces?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {roleNeedsMunicipality(role) && provinceId && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Município</Label>
          <Select value={municipalityId} onValueChange={v => { setMunicipality(v); setSchool(""); }}>
            <SelectTrigger><SelectValue placeholder="Selecione o município..." /></SelectTrigger>
            <SelectContent>{filteredMuns?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {roleNeedsSchool(role) && municipalityId && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />Escola</Label>
          <Select value={schoolId} onValueChange={setSchool}>
            <SelectTrigger><SelectValue placeholder="Selecione a escola..." /></SelectTrigger>
            <SelectContent>{filteredSchls?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
            <p className="text-sm text-muted-foreground">Registo de credenciais, papéis hierárquicos e gestão de acessos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ROLES.map(r => (
            <Card key={r.value} className="border-l-4" style={{ borderLeftColor: `var(--${r.value === 'ADMIN' ? 'warning' : 'primary'})` }}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{users.filter(u => u.role === r.value).length}</p>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Credenciais de Acesso</CardTitle>
                <CardDescription>Gerir utilizadores com papéis hierárquicos</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Actualizar</Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Novo Utilizador</Button></DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle><UserPlus className="h-5 w-5 text-primary inline mr-2" />Registar Novo Utilizador</DialogTitle>
                      <DialogDescription>Crie credenciais com papel hierárquico</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@dmen.gov.ao" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Senha</Label><Input type="password" placeholder="Mín. 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                      </div>
                      <div className="space-y-2">
                        <Label>Papel no Sistema</Label>
                        <Select value={newRole} onValueChange={v => { setNewRole(v); setNewProvinceId(""); setNewMunicipalityId(""); setNewSchoolId(""); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map(r => (
                              <SelectItem key={r.value} value={r.value}>
                                <span className="font-medium">{r.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">— {r.description}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {renderHierarchySelects(
                        newRole,
                        newProvinceId, setNewProvinceId,
                        newMunicipalityId, setNewMunicipalityId,
                        newSchoolId, setNewSchoolId,
                        createFilteredMunicipalities,
                        createFilteredSchools
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateUser} disabled={isCreating}>{isCreating ? "A criar..." : "Criar Utilizador"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Separator className="mt-4" />
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar por ID..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum utilizador encontrado</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>ID</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Âmbito Hierárquico</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono">{u.user_id.substring(0, 8)}...</p>
                            {u.user_id === user?.id && <Badge variant="outline" className="text-[10px]">Você</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[u.role] || ""}>
                            {ALL_ROLES.find(r => r.value === u.role)?.label || u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {getProvinceName(u.province_id) && <div className="flex items-center gap-1"><Map className="h-3 w-3" />{getProvinceName(u.province_id)}</div>}
                          {getMunicipalityName(u.municipality_id) && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{getMunicipalityName(u.municipality_id)}</div>}
                          {getSchoolName(u.school_id) && <div className="flex items-center gap-1"><Building2 className="h-3 w-3" />{getSchoolName(u.school_id)}</div>}
                          {!u.province_id && !u.municipality_id && !u.school_id && <span className="italic">Global</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.active}
                              onCheckedChange={checked => toggleActiveMutation.mutate({ id: u.id, active: checked })}
                              disabled={u.user_id === user?.id}
                            />
                            <Badge variant={u.active ? "default" : "secondary"} className={u.active ? "bg-green-500/10 text-green-700 border-green-200" : ""}>
                              {u.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.user_id === user?.id ? (
                            <span className="text-xs text-muted-foreground italic">Sessão actual</span>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(u)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />Editar
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

        {/* Edit Hierarchy Dialog */}
        <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Editar Papel e Âmbito</DialogTitle>
              <DialogDescription>
                Utilizador: <span className="font-mono">{editUser?.user_id?.substring(0, 12)}...</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Papel no Sistema</Label>
                <Select value={editRole} onValueChange={v => { setEditRole(v); setEditProvinceId(""); setEditMunicipalityId(""); setEditSchoolId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {r.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderHierarchySelects(
                editRole,
                editProvinceId, setEditProvinceId,
                editMunicipalityId, setEditMunicipalityId,
                editSchoolId, setEditSchoolId,
                editFilteredMunicipalities,
                editFilteredSchools
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? "A guardar..." : "Guardar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
