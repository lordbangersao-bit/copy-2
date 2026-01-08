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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfessorForm } from "@/components/ProfessorForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useProfessores,
  useCreateProfessor,
  useUpdateProfessor,
  useDeleteProfessor,
  Professor,
  ProfessorInput,
} from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Professores() {
  const { data: escolas } = useEscolas();
  const [escolaFilter, setEscolaFilter] = useState<string>("");
  const { data: professores, isLoading } = useProfessores(escolaFilter || undefined);
  const createProfessor = useCreateProfessor();
  const updateProfessor = useUpdateProfessor();
  const deleteProfessor = useDeleteProfessor();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProfessores = professores?.filter((professor) =>
    professor.nome.toLowerCase().includes(search.toLowerCase()) ||
    professor.disciplina?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: ProfessorInput) => {
    createProfessor.mutate(data);
  };

  const handleUpdate = (data: ProfessorInput) => {
    if (editingProfessor) {
      updateProfessor.mutate({ id: editingProfessor.id, ...data });
      setEditingProfessor(null);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProfessor.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ativo: "bg-success/10 text-success",
      afastado: "bg-warning/10 text-warning",
      inativo: "bg-muted text-muted-foreground",
    };
    return styles[status as keyof typeof styles] || styles.inativo;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Professores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os professores do município
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Professor
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou disciplina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={escolaFilter} onValueChange={setEscolaFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por escola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as escolas</SelectItem>
              {escolas?.map((escola) => (
                <SelectItem key={escola.id} value={escola.id}>
                  {escola.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Escola</TableHead>
                <TableHead className="hidden sm:table-cell">Disciplina</TableHead>
                <TableHead className="hidden lg:table-cell">Admissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProfessores && filteredProfessores.length > 0 ? (
                filteredProfessores.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/20">
                          <Users className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">{professor.nome}</p>
                          {professor.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {professor.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {professor.escolas?.nome || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {professor.disciplina || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {professor.data_admissao
                        ? format(new Date(professor.data_admissao), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusBadge(
                          professor.status
                        )}`}
                      >
                        {professor.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(professor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(professor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {search || escolaFilter
                          ? "Nenhum professor encontrado"
                          : "Nenhum professor cadastrado ainda"}
                      </p>
                      {!search && !escolaFilter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormOpen(true)}
                        >
                          Cadastrar primeiro professor
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

      {/* Forms */}
      <ProfessorForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProfessor(null);
        }}
        professor={editingProfessor}
        onSubmit={editingProfessor ? handleUpdate : handleCreate}
        isLoading={createProfessor.isPending || updateProfessor.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir professor"
        description="Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        confirmText="Excluir"
        variant="destructive"
      />
    </Layout>
  );
}
