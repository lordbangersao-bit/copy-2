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
import { EscolaForm } from "@/components/EscolaForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useEscolas,
  useCreateEscola,
  useUpdateEscola,
  useDeleteEscola,
  Escola,
  EscolaInput,
} from "@/hooks/useEscolas";
import { Plus, Search, Pencil, Trash2, School } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Escolas() {
  const { data: escolas, isLoading } = useEscolas();
  const createEscola = useCreateEscola();
  const updateEscola = useUpdateEscola();
  const deleteEscola = useDeleteEscola();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredEscolas = escolas?.filter((escola) =>
    escola.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: EscolaInput) => {
    createEscola.mutate(data);
  };

  const handleUpdate = (data: EscolaInput) => {
    if (editingEscola) {
      updateEscola.mutate({ id: editingEscola.id, ...data });
      setEditingEscola(null);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteEscola.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (escola: Escola) => {
    setEditingEscola(escola);
    setFormOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escolas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as escolas do município
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Escola
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar escolas..."
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
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Diretor(a)</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEscolas && filteredEscolas.length > 0 ? (
                filteredEscolas.map((escola) => (
                  <TableRow key={escola.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <School className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{escola.nome}</p>
                          {escola.endereco && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {escola.endereco}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {escola.diretor || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {escola.telefone || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {escola.email || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(escola)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(escola.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <School className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {search
                          ? "Nenhuma escola encontrada"
                          : "Nenhuma escola cadastrada ainda"}
                      </p>
                      {!search && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormOpen(true)}
                        >
                          Cadastrar primeira escola
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
      <EscolaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEscola(null);
        }}
        escola={editingEscola}
        onSubmit={editingEscola ? handleUpdate : handleCreate}
        isLoading={createEscola.isPending || updateEscola.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir escola"
        description="Tem certeza que deseja excluir esta escola? Os professores vinculados ficarão sem escola."
        onConfirm={handleDelete}
        confirmText="Excluir"
        variant="destructive"
      />
    </Layout>
  );
}
