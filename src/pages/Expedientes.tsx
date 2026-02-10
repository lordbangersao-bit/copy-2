import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExpedienteForm } from "@/components/ExpedienteForm";
import {
  useExpedientes,
  useCreateExpediente,
  useUpdateExpedienteEstado,
  useDeleteExpediente,
  Expediente,
  EstadoExpediente,
  getTipoLabel,
  getEstadoLabel,
} from "@/hooks/useExpedientes";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Trash2,
  Lock,
  Building2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ESTADO_VARIANT: Record<EstadoExpediente, "default" | "secondary" | "destructive" | "outline"> = {
  SUBMETIDO: "secondary",
  EM_ANALISE: "outline",
  APROVADO: "default",
  REJEITADO: "destructive",
};

const ESTADO_ICON: Record<EstadoExpediente, React.ComponentType<{ className?: string }>> = {
  SUBMETIDO: Send,
  EM_ANALISE: Clock,
  APROVADO: CheckCircle,
  REJEITADO: XCircle,
};

export default function Expedientes() {
  const { isAdmin } = useAuth();
  const { data: expedientes, isLoading, error } = useExpedientes();
  const createExpediente = useCreateExpediente();
  const updateEstado = useUpdateExpedienteEstado();
  const deleteExpediente = useDeleteExpediente();

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [viewingExpediente, setViewingExpediente] = useState<Expediente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reviewExpediente, setReviewExpediente] = useState<Expediente | null>(null);
  const [reviewEstado, setReviewEstado] = useState<EstadoExpediente>("APROVADO");
  const [reviewObs, setReviewObs] = useState("");

  const filtered = expedientes?.filter((exp) => {
    const matchSearch =
      exp.titulo.toLowerCase().includes(search.toLowerCase()) ||
      exp.escola_nome?.toLowerCase().includes(search.toLowerCase()) ||
      exp.submetido_por?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "all" || exp.tipo === filterTipo;
    const matchEstado = filterEstado === "all" || exp.estado === filterEstado;
    return matchSearch && matchTipo && matchEstado;
  });

  // Stats
  const stats = {
    total: expedientes?.length || 0,
    submetidos: expedientes?.filter((e) => e.estado === "SUBMETIDO").length || 0,
    emAnalise: expedientes?.filter((e) => e.estado === "EM_ANALISE").length || 0,
    aprovados: expedientes?.filter((e) => e.estado === "APROVADO").length || 0,
    rejeitados: expedientes?.filter((e) => e.estado === "REJEITADO").length || 0,
  };

  const handleReview = () => {
    if (!reviewExpediente) return;
    updateEstado.mutate(
      {
        id: reviewExpediente.id,
        estado: reviewEstado,
        observacoes_revisao: reviewObs || undefined,
        analisado_por: "Administrador",
      },
      {
        onSuccess: () => {
          setReviewExpediente(null);
          setReviewObs("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteExpediente.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: pt });
    } catch {
      return date;
    }
  };

  const renderDadosDetail = (exp: Expediente) => {
    const dados = exp.dados || {};
    const entries = Object.entries(dados).filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">Sem dados estruturados</p>;

    const labelMap: Record<string, string> = {
      total_agentes: "Total de Agentes",
      agentes_presentes: "Agentes Presentes",
      faltas_justificadas: "Faltas Justificadas",
      faltas_injustificadas: "Faltas Injustificadas",
      num_beneficiarios: "Nº de Beneficiários",
      valor_total: "Valor Total (Kz)",
      periodo_ferias: "Período de Férias",
      total_alunos: "Total de Alunos",
      alunos_masculino: "Alunos Masculinos",
      alunos_feminino: "Alunos Femininos",
      total_turmas: "Total de Turmas",
      taxa_aprovacao: "Taxa de Aprovação (%)",
      taxa_desistencia: "Taxa de Desistência (%)",
      categoria: "Categoria",
      detalhes: "Detalhes",
    };

    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-1">
            <p className="text-xs text-muted-foreground">{labelMap[key] || key}</p>
            <p className="text-sm font-medium">{String(value)}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Expedientes"
          description="Submissão e gestão de mapas de faltas, subsídios, estatísticos e outros documentos"
          icon={<FileText className="h-6 w-6" />}
          badge={
            !isAdmin ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Visualização
              </Badge>
            ) : null
          }
          actions={
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Expediente
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Submetidos", value: stats.submetidos, color: "text-muted-foreground" },
            { label: "Em Análise", value: stats.emAnalise, color: "text-warning" },
            { label: "Aprovados", value: stats.aprovados, color: "text-secondary" },
            { label: "Rejeitados", value: stats.rejeitados, color: "text-destructive" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título, escola ou gestor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="MAPA_FALTAS">Mapa de Faltas</SelectItem>
                  <SelectItem value="MAPA_SUBSIDIO_FERIAS">Subsídio de Férias</SelectItem>
                  <SelectItem value="MAPA_ESTATISTICO">Mapa Estatístico</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="SUBMETIDO">Submetido</SelectItem>
                  <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                  <SelectItem value="APROVADO">Aprovado</SelectItem>
                  <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {error ? (
            <EmptyState
              type="error"
              title="Erro ao carregar expedientes"
              description={error.message}
              action={{ label: "Tentar novamente", onClick: () => window.location.reload() }}
            />
          ) : isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Expediente</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">Escola</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Período</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Data</TableHead>
                  <TableHead className="w-20 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exp) => {
                  const EstadoIcon = ESTADO_ICON[exp.estado];
                  return (
                    <TableRow key={exp.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{exp.titulo}</p>
                            {exp.submetido_por && (
                              <p className="text-xs text-muted-foreground">por {exp.submetido_por}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getTipoLabel(exp.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{exp.escola_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {exp.periodo_referencia || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_VARIANT[exp.estado]} className="gap-1">
                          <EstadoIcon className="h-3 w-3" />
                          {getEstadoLabel(exp.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(exp.data_submissao)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingExpediente(exp)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            {isAdmin && exp.estado !== "APROVADO" && exp.estado !== "REJEITADO" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setReviewExpediente(exp); setReviewEstado("APROVADO"); }}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Analisar / Decidir
                                </DropdownMenuItem>
                              </>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(exp.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              type={search || filterTipo !== "all" || filterEstado !== "all" ? "no-results" : "empty"}
              title={search ? "Nenhum expediente encontrado" : "Nenhum expediente submetido"}
              description={search ? "Tente ajustar os filtros" : "Comece submetendo o primeiro expediente"}
              action={!search ? { label: "Submeter Expediente", onClick: () => setFormOpen(true) } : undefined}
            />
          )}
        </Card>
      </div>

      {/* Form Dialog */}
      <ExpedienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createExpediente.mutate(data, { onSuccess: () => setFormOpen(false) })}
        isSubmitting={createExpediente.isPending}
      />

      {/* View Detail Dialog */}
      <Dialog open={!!viewingExpediente} onOpenChange={(open) => !open && setViewingExpediente(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes do Expediente
            </DialogTitle>
          </DialogHeader>
          {viewingExpediente && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Informações Gerais</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Título</p>
                      <p className="text-sm font-medium">{viewingExpediente.titulo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-sm font-medium">{getTipoLabel(viewingExpediente.tipo)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Escola</p>
                      <p className="text-sm font-medium">{viewingExpediente.escola_nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <Badge variant={ESTADO_VARIANT[viewingExpediente.estado]}>
                        {getEstadoLabel(viewingExpediente.estado)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Período</p>
                      <p className="text-sm font-medium">{viewingExpediente.periodo_referencia || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Submetido por</p>
                      <p className="text-sm font-medium">{viewingExpediente.submetido_por || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Data de Submissão</p>
                      <p className="text-sm font-medium">{formatDate(viewingExpediente.data_submissao)}</p>
                    </div>
                    {viewingExpediente.data_analise && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Data de Análise</p>
                        <p className="text-sm font-medium">{formatDate(viewingExpediente.data_analise)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {viewingExpediente.descricao && (
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-3">Descrição</h3>
                    <p className="text-sm p-4 bg-muted/30 rounded-lg">{viewingExpediente.descricao}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Dados do Expediente</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    {renderDadosDetail(viewingExpediente)}
                  </div>
                </div>

                {/* Workflow timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Fluxo do Expediente</h3>
                  <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                    {(["SUBMETIDO", "EM_ANALISE", "APROVADO"] as EstadoExpediente[]).map((estado, i) => {
                      const Icon = ESTADO_ICON[estado];
                      const isActive = viewingExpediente.estado === estado;
                      const isPast =
                        (estado === "SUBMETIDO") ||
                        (estado === "EM_ANALISE" && ["EM_ANALISE", "APROVADO", "REJEITADO"].includes(viewingExpediente.estado)) ||
                        (estado === "APROVADO" && viewingExpediente.estado === "APROVADO");
                      return (
                        <div key={estado} className="flex items-center gap-2">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="h-3 w-3" />
                            {getEstadoLabel(estado)}
                          </div>
                          {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      );
                    })}
                  </div>
                  {viewingExpediente.estado === "REJEITADO" && (
                    <div className="mt-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">Expediente Rejeitado</p>
                      {viewingExpediente.observacoes_revisao && (
                        <p className="text-sm mt-1">{viewingExpediente.observacoes_revisao}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewExpediente} onOpenChange={(open) => !open && setReviewExpediente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analisar Expediente</DialogTitle>
          </DialogHeader>
          {reviewExpediente && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">{reviewExpediente.titulo}</p>
                <p className="text-xs text-muted-foreground">{reviewExpediente.escola_nome} • {getTipoLabel(reviewExpediente.tipo)}</p>
              </div>
              <div className="space-y-2">
                <Label>Decisão</Label>
                <Select value={reviewEstado} onValueChange={(v) => setReviewEstado(v as EstadoExpediente)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM_ANALISE">Marcar como Em Análise</SelectItem>
                    <SelectItem value="APROVADO">Aprovar</SelectItem>
                    <SelectItem value="REJEITADO">Rejeitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações da Revisão</Label>
                <Textarea value={reviewObs} onChange={(e) => setReviewObs(e.target.value)} placeholder="Motivos da decisão..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewExpediente(null)}>Cancelar</Button>
            <Button onClick={handleReview} disabled={updateEstado.isPending}>
              {updateEstado.isPending ? "A processar..." : "Confirmar Decisão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Expediente"
        description="Tem certeza que deseja excluir este expediente? Esta ação não pode ser desfeita."
      />
    </AppLayout>
  );
}
