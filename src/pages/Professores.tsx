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
  ProfessorWithEscola,
  useUpdateProfessor,
  useDeleteProfessor,
  Professor,
  ProfessorInput,
} from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { Plus, Search, Pencil, Trash2, Users, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [viewingProfessor, setViewingProfessor] = useState<ProfessorWithEscola | null>(null);

  const filteredProfessores = professores?.filter((professor) =>
    professor.nome.toLowerCase().includes(search.toLowerCase()) ||
    professor.funcao?.toLowerCase().includes(search.toLowerCase()) ||
    professor.numero_agente?.toLowerCase().includes(search.toLowerCase())
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
    const styles: Record<string, string> = {
      ativo: "bg-success/10 text-success border-success/20",
      afastado: "bg-warning/10 text-warning border-warning/20",
      inativo: "bg-muted text-muted-foreground border-muted",
    };
    return styles[status] || styles.inativo;
  };

  const getActivityBadge = (actividade: string | null) => {
    const styles: Record<string, string> = {
      activo: "bg-success/10 text-success border-success/20",
      inactivo: "bg-destructive/10 text-destructive border-destructive/20",
      reformado: "bg-muted text-muted-foreground border-muted",
      licença: "bg-warning/10 text-warning border-warning/20",
    };
    return styles[actividade?.toLowerCase() || "activo"] || styles.activo;
  };

  const DetailItem = ({ label, value }: { label: string; value: string | number | boolean | null | undefined }) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">
        {value === true ? "Sim" : value === false ? "Não" : value || "-"}
      </p>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agentes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os agentes do município
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Agente
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, função ou nº agente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={escolaFilter} onValueChange={setEscolaFilter}>
            <SelectTrigger className="w-full sm:w-64 bg-background">
              <SelectValue placeholder="Filtrar por local" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos os locais</SelectItem>
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
                <TableHead>Nº Agente</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Função</TableHead>
                <TableHead className="hidden lg:table-cell">Local de Trabalho</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>Actividade</TableHead>
                <TableHead className="w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProfessores && filteredProfessores.length > 0 ? (
                filteredProfessores.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-mono text-sm">
                      {professor.numero_agente || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/20">
                          <Users className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">{professor.nome}</p>
                          {professor.telefone && (
                            <p className="text-xs text-muted-foreground">
                              {professor.telefone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {professor.funcao || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {professor.escolas?.nome || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {professor.categoria || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getActivityBadge(professor.actividade)}`}
                      >
                        {professor.actividade || "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingProfessor(professor)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(professor)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(professor.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {search || escolaFilter
                          ? "Nenhum agente encontrado"
                          : "Nenhum agente cadastrado ainda"}
                      </p>
                      {!search && !escolaFilter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormOpen(true)}
                        >
                          Cadastrar primeiro agente
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

      {/* View Details Dialog */}
      <Dialog open={!!viewingProfessor} onOpenChange={(open) => !open && setViewingProfessor(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Agente</DialogTitle>
          </DialogHeader>
          {viewingProfessor && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Identificação */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 border-b pb-2">Identificação</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DetailItem label="Nº de Cadastro" value={viewingProfessor.numero_cadastro} />
                    <DetailItem label="Nº Agente" value={viewingProfessor.numero_agente} />
                    <DetailItem label="Nome" value={viewingProfessor.nome} />
                    <DetailItem label="Data de Nascimento" value={viewingProfessor.data_nascimento} />
                    <DetailItem label="Idade" value={viewingProfessor.idade} />
                    <DetailItem label="Género" value={viewingProfessor.genero} />
                    <DetailItem label="Documento" value={viewingProfessor.cpf} />
                    <DetailItem label="Estado Civil" value={viewingProfessor.estado_civil} />
                    <DetailItem label="Telefone" value={viewingProfessor.telefone} />
                    <DetailItem label="Email" value={viewingProfessor.email} />
                    <DetailItem label="Condição Física" value={viewingProfessor.condicao_fisica} />
                    <DetailItem label="Estado de Saúde" value={viewingProfessor.estado_saude} />
                    <DetailItem label="Arquivo Pessoal" value={viewingProfessor.arquivo_pessoal} />
                  </div>
                </div>

                {/* Profissional */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 border-b pb-2">Dados Profissionais</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DetailItem label="Função" value={viewingProfessor.funcao} />
                    <DetailItem label="Categoria" value={viewingProfessor.categoria} />
                    <DetailItem label="Local de Trabalho" value={viewingProfessor.escolas?.nome} />
                    <DetailItem label="Nível Académico" value={viewingProfessor.nivel_academico} />
                    <DetailItem label="Formado em" value={viewingProfessor.formado_em} />
                    <DetailItem label="Disciplina" value={viewingProfessor.disciplina} />
                    <DetailItem label="Regime de Contrato" value={viewingProfessor.regime_contrato} />
                    <DetailItem label="Início de Função" value={viewingProfessor.inicio_funcao} />
                    <DetailItem label="Tempo de Serviço" value={viewingProfessor.tempo_servico} />
                    <DetailItem label="Processos Disciplinares" value={viewingProfessor.qtd_processo_disciplinar} />
                    <DetailItem label="Actividade" value={viewingProfessor.actividade} />
                    <DetailItem label="Agente Transferido" value={viewingProfessor.agente_transferido} />
                    <DetailItem label="Status" value={viewingProfessor.status} />
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 border-b pb-2">Localização</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DetailItem label="Província" value={viewingProfessor.provincia} />
                    <DetailItem label="Comuna" value={viewingProfessor.comuna} />
                    <DetailItem label="Bairro / Localidade" value={viewingProfessor.bairro_localidade} />
                  </div>
                </div>

                {/* Família */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 border-b pb-2">Dados Familiares</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DetailItem label="Dependentes" value={viewingProfessor.dependentes} />
                    <DetailItem label="Nº de Dependentes" value={viewingProfessor.num_dependentes} />
                    <DetailItem label="Nome do(a) Parceiro(a)" value={viewingProfessor.nome_parceira} />
                    <DetailItem label="Telefone Parceiro(a)" value={viewingProfessor.telefone_parceira} />
                    <DetailItem label="Outro Familiar" value={viewingProfessor.outro_familiar} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

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
        title="Excluir agente"
        description="Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        confirmText="Excluir"
        variant="destructive"
      />
    </Layout>
  );
}
