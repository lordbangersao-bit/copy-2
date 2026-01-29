import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnidadeOrganicaForm } from "@/components/UnidadeOrganicaForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useUnidadesOrganicas,
  useCreateUnidadeOrganica,
  useUpdateUnidadeOrganica,
  useDeleteUnidadeOrganica,
  UnidadeOrganica,
  UnidadeOrganicaInput,
} from "@/hooks/useUnidadesOrganicas";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Pencil, Trash2, Building2, Users, GraduationCap, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UnidadesOrganicas() {
  const { isAdmin } = useAuth();
  const { data: unidades, isLoading } = useUnidadesOrganicas();
  const createUnidade = useCreateUnidadeOrganica();
  const updateUnidade = useUpdateUnidadeOrganica();
  const deleteUnidade = useDeleteUnidadeOrganica();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeOrganica | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredUnidades = unidades?.filter((unidade) =>
    unidade.nome.toLowerCase().includes(search.toLowerCase()) ||
    unidade.codigo_organico?.toLowerCase().includes(search.toLowerCase()) ||
    unidade.residencia?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: UnidadeOrganicaInput) => {
    createUnidade.mutate(data);
  };

  const handleUpdate = (data: UnidadeOrganicaInput) => {
    if (editingUnidade) {
      updateUnidade.mutate({ id: editingUnidade.id, ...data });
      setEditingUnidade(null);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteUnidade.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (unidade: UnidadeOrganica) => {
    if (!isAdmin) return;
    setEditingUnidade(unidade);
    setFormOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Unidades Orgânicas</h1>
            <p className="text-muted-foreground mt-1">
              Gestão das unidades orgânicas do município
            </p>
          </div>
          {isAdmin ? (
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Unidade
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1 py-1.5">
              <Lock className="h-3 w-3" />
              Modo Visualização
            </Badge>
          )}
        </div>

        {!isAdmin && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Você está em modo de visualização. Apenas administradores podem criar, editar ou excluir registos.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou residência..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade Orgânica</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead className="hidden sm:table-cell">Residência</TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Docentes
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Alunos
                  </div>
                </TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUnidades && filteredUnidades.length > 0 ? (
                filteredUnidades.map((unidade) => (
                  <TableRow key={unidade.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{unidade.nome}</p>
                          {unidade.diretor && (
                            <p className="text-xs text-muted-foreground">
                              Dir: {unidade.diretor}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {unidade.codigo_organico ? (
                        <Badge variant="outline">{unidade.codigo_organico}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {unidade.residencia || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <span className="font-medium">{unidade.total_docentes || 0}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({unidade.prof_masculino || 0}M / {unidade.prof_feminino || 0}F)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <span className="font-medium">{unidade.total_alunos || 0}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({unidade.total_turmas || 0} turmas)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isAdmin ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(unidade)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(unidade.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {search
                          ? "Nenhuma unidade orgânica encontrada"
                          : "Nenhuma unidade orgânica cadastrada ainda"}
                      </p>
                      {!search && isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormOpen(true)}
                        >
                          Cadastrar primeira unidade
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Forms - Only for Admin */}
      {isAdmin && (
        <>
          <UnidadeOrganicaForm
            open={formOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setEditingUnidade(null);
            }}
            unidade={editingUnidade}
            onSubmit={editingUnidade ? handleUpdate : handleCreate}
            isLoading={createUnidade.isPending || updateUnidade.isPending}
          />

          <ConfirmDialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
            title="Excluir unidade orgânica"
            description="Tem certeza que deseja excluir esta unidade orgânica? Os agentes vinculados ficarão sem unidade."
            onConfirm={handleDelete}
            confirmText="Excluir"
            variant="destructive"
          />
        </>
      )}
    </Layout>
  );
}
