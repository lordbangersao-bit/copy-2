import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
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
import { useProfessores } from "@/hooks/useProfessores";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useAuth } from "@/hooks/useAuth";
import {
  classificarFuncionario,
  type ClasseFuncionario,
} from "@/lib/classificarFuncionario";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  Users,
  GraduationCap,
  Lock,
  Download,
  MoreHorizontal,
  Eye,
  MapPin,
  BookOpen,
  ShieldCheck,
  Briefcase,
  HardHat,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface EfectivosStats {
  total: number;
  docente: number;
  direccao_chefia: number;
  administrativo: number;
  operario_apoio: number;
  subclasses: { subclasse: string; classe: ClasseFuncionario; total: number }[];
}

export default function UnidadesOrganicas() {
  const { isAdmin, role, roleInfo } = useAuth();
  const [searchParams] = useSearchParams();
  const municipioId = searchParams.get("municipio") || undefined;
  
  const { data: municipalities } = useMunicipalities(roleInfo.province_id || undefined);
  const municipioNome = municipioId
    ? municipalities?.find(m => m.id === municipioId)?.name
    : undefined;

  const { data: unidades, isLoading, error } = useUnidadesOrganicas(municipioId);
  const { data: professores, isLoading: professoresLoading } = useProfessores();
  const createUnidade = useCreateUnidadeOrganica();
  const updateUnidade = useUpdateUnidadeOrganica();
  const deleteUnidade = useDeleteUnidadeOrganica();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeOrganica | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingUnidade, setViewingUnidade] = useState<UnidadeOrganica | null>(
    null
  );

  // Calculate efectivos stats per unidade orgânica
  const efectivosPorUnidade = useMemo(() => {
    const map = new Map<string, EfectivosStats>();
    if (!professores) return map;

    professores.forEach((p) => {
      const escolaId = p.escola_id;
      if (!escolaId) return;

      const info = classificarFuncionario(p.categoria, p.funcao);
      
      if (!map.has(escolaId)) {
        map.set(escolaId, {
          total: 0,
          docente: 0,
          direccao_chefia: 0,
          administrativo: 0,
          operario_apoio: 0,
          subclasses: [],
        });
      }

      const stats = map.get(escolaId)!;
      stats.total++;
      stats[info.classe]++;

      const existing = stats.subclasses.find(
        (s) => s.subclasse === info.subclasse && s.classe === info.classe
      );
      if (existing) {
        existing.total++;
      } else {
        stats.subclasses.push({
          subclasse: info.subclasse,
          classe: info.classe,
          total: 1,
        });
      }
    });

    // Sort subclasses
    map.forEach((stats) => {
      stats.subclasses.sort((a, b) => b.total - a.total);
    });

    return map;
  }, [professores]);

  // Global totals from efectivos
  const globalEfectivos = useMemo(() => {
    const totals = { total: 0, docente: 0, direccao_chefia: 0, administrativo: 0, operario_apoio: 0 };
    efectivosPorUnidade.forEach((stats) => {
      totals.total += stats.total;
      totals.docente += stats.docente;
      totals.direccao_chefia += stats.direccao_chefia;
      totals.administrativo += stats.administrativo;
      totals.operario_apoio += stats.operario_apoio;
    });
    return totals;
  }, [efectivosPorUnidade]);

  const filteredUnidades = unidades?.filter(
    (unidade) =>
      unidade.nome.toLowerCase().includes(search.toLowerCase()) ||
      unidade.codigo_organico?.toLowerCase().includes(search.toLowerCase()) ||
      unidade.residencia?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: UnidadeOrganicaInput) => {
    const payload = municipioId ? { ...data, municipality_id: municipioId } : data;
    createUnidade.mutate(payload as any);
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

  // Calculate totals
  const totalDocentes = unidades?.reduce(
    (acc, u) => acc + (u.total_docentes || 0),
    0
  ) || 0;
  const totalAlunos = unidades?.reduce(
    (acc, u) => acc + (u.total_alunos || 0),
    0
  ) || 0;
  const totalTurmas = unidades?.reduce(
    (acc, u) => acc + (u.total_turmas || 0),
    0
  ) || 0;

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null | undefined;
  }) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={municipioNome ? `Unidades Orgânicas — ${municipioNome}` : "Unidades Orgânicas"}
          description={municipioNome ? `Gestão das escolas do município de ${municipioNome}` : "Gestão das escolas e unidades educacionais"}
          icon={<Building2 className="h-6 w-6" />}
          badge={
            <>
              {municipioId && (
                <Link to="/escolas">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                    ✕ Limpar filtro
                  </Badge>
                </Link>
              )}
              {!isAdmin ? (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Visualização
                </Badge>
              ) : null}
            </>
          }
            !isAdmin ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Visualização
              </Badge>
            ) : null
          }
          actions={
            isAdmin ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => setFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </div>
            ) : null
          }
        />

        {/* View Mode Alert */}
        {!isAdmin && (
          <Alert className="border-warning/50 bg-warning/5">
            <Lock className="h-4 w-4 text-warning" />
            <AlertDescription>
              Você está em modo de visualização. Apenas administradores podem
              criar, editar ou excluir registos.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Unidades
                  </p>
                  <p className="text-2xl font-bold">{unidades?.length || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Efectivos
                  </p>
                  <p className="text-2xl font-bold text-secondary">
                    {globalEfectivos.total.toLocaleString("pt-AO")}
                  </p>
                </div>
                <Users className="h-8 w-8 text-secondary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Alunos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {totalAlunos.toLocaleString("pt-AO")}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Turmas
                  </p>
                  <p className="text-2xl font-bold">{totalTurmas}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Efectivos por Classe - Global */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Docentes</p>
              </div>
              <p className="text-xl font-bold text-primary">{globalEfectivos.docente}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                <p className="text-xs font-medium text-muted-foreground">Direcção e Chefia</p>
              </div>
              <p className="text-xl font-bold text-secondary">{globalEfectivos.direccao_chefia}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-muted-foreground">Administrativos</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{globalEfectivos.administrativo}</p>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <HardHat className="h-4 w-4 text-warning" />
                <p className="text-xs font-medium text-muted-foreground">Operários e Apoio</p>
              </div>
              <p className="text-xl font-bold text-warning">{globalEfectivos.operario_apoio}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, código ou residência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {error ? (
            <EmptyState
              type="error"
              title="Erro ao carregar dados"
              description={error.message}
              action={{
                label: "Tentar novamente",
                onClick: () => window.location.reload(),
              }}
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
          ) : filteredUnidades && filteredUnidades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Unidade Orgânica</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">
                    Código
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">
                    Residência
                  </TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Efectivos
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      Alunos
                    </div>
                  </TableHead>
                  <TableHead className="w-20 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnidades.map((unidade) => (
                  <TableRow key={unidade.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
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
                        <Badge variant="outline" className="font-mono">
                          {unidade.codigo_organico}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {unidade.residencia ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {unidade.residencia}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {(() => {
                        const stats = efectivosPorUnidade.get(unidade.id);
                        const total = stats?.total || 0;
                        return (
                          <div className="space-y-1">
                            <span className="font-semibold text-sm">{total}</span>
                            {total > 0 && stats && (
                              <div className="flex gap-1 flex-wrap">
                                {stats.docente > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary">
                                    {stats.docente} Doc
                                  </Badge>
                                )}
                                {stats.direccao_chefia > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-secondary/30 text-secondary">
                                    {stats.direccao_chefia} Dir
                                  </Badge>
                                )}
                                {stats.administrativo > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-accent/30 text-accent-foreground">
                                    {stats.administrativo} Adm
                                  </Badge>
                                )}
                                {stats.operario_apoio > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-warning/30 text-warning">
                                    {stats.operario_apoio} Op
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <span className="font-medium">
                          {(unidade.total_alunos || 0).toLocaleString("pt-AO")}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({unidade.total_turmas || 0} turmas)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setViewingUnidade(unidade)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEdit(unidade)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(unidade.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              type={search ? "no-results" : "empty"}
              title={
                search
                  ? "Nenhuma unidade encontrada"
                  : "Nenhuma unidade cadastrada"
              }
              description={
                search
                  ? "Tente ajustar os termos de pesquisa"
                  : "Comece adicionando a primeira unidade orgânica ao sistema"
              }
              action={
                !search && isAdmin
                  ? {
                      label: "Cadastrar Unidade",
                      onClick: () => setFormOpen(true),
                    }
                  : undefined
              }
            />
          )}
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewingUnidade}
        onOpenChange={(open) => !open && setViewingUnidade(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Detalhes da Unidade Orgânica
            </DialogTitle>
          </DialogHeader>
          {viewingUnidade && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Informações Gerais
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem label="Nome" value={viewingUnidade.nome} />
                    <DetailItem
                      label="Código Orgânico"
                      value={viewingUnidade.codigo_organico}
                    />
                    <DetailItem label="Director" value={viewingUnidade.diretor} />
                    <DetailItem
                      label="Residência"
                      value={viewingUnidade.residencia}
                    />
                    <DetailItem
                      label="Distância da Sede"
                      value={viewingUnidade.distancia_sede}
                    />
                    <DetailItem
                      label="Construção"
                      value={viewingUnidade.construcao}
                    />
                    <DetailItem
                      label="Decreto de Criação"
                      value={viewingUnidade.decreto_criacao}
                    />
                    <DetailItem label="Telefone" value={viewingUnidade.telefone} />
                    <DetailItem label="Email" value={viewingUnidade.email} />
                  </div>
                </div>

                {/* Efectivos - Recursos Humanos */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Efectivos (Recursos Humanos)
                  </h3>
                  {(() => {
                    const stats = viewingUnidade ? efectivosPorUnidade.get(viewingUnidade.id) : null;
                    const total = stats?.total || 0;
                    return (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="text-center p-3 rounded-lg bg-primary/10">
                            <p className="text-xs text-muted-foreground mb-1">Docentes</p>
                            <p className="text-lg font-bold text-primary">{stats?.docente || 0}</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-secondary/10">
                            <p className="text-xs text-muted-foreground mb-1">Direcção</p>
                            <p className="text-lg font-bold text-secondary">{stats?.direccao_chefia || 0}</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-accent/10">
                            <p className="text-xs text-muted-foreground mb-1">Administrativos</p>
                            <p className="text-lg font-bold text-accent-foreground">{stats?.administrativo || 0}</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-warning/10">
                            <p className="text-xs text-muted-foreground mb-1">Operários</p>
                            <p className="text-lg font-bold text-warning">{stats?.operario_apoio || 0}</p>
                          </div>
                        </div>
                        
                        {total > 0 && stats && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Total de Efectivos</span>
                              <span className="font-bold">{total}</span>
                            </div>
                            <div className="space-y-2">
                              {stats.subclasses.map((sub, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      sub.classe === "docente" ? "bg-primary" :
                                      sub.classe === "direccao_chefia" ? "bg-secondary" :
                                      sub.classe === "administrativo" ? "bg-accent" :
                                      "bg-warning"
                                    }`} />
                                    <span>{sub.subclasse}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {sub.total}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {total === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Nenhum agente vinculado a esta unidade
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Dados Académicos */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Dados Académicos
                  </h3>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem
                      label="Total de Alunos"
                      value={viewingUnidade.total_alunos?.toLocaleString("pt-AO")}
                    />
                    <DetailItem
                      label="Alunos Masculinos"
                      value={viewingUnidade.alunos_masculino?.toLocaleString(
                        "pt-AO"
                      )}
                    />
                    <DetailItem
                      label="Alunas Femininas"
                      value={viewingUnidade.alunos_feminino?.toLocaleString(
                        "pt-AO"
                      )}
                    />
                    <DetailItem
                      label="Total de Turmas"
                      value={viewingUnidade.total_turmas}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

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
    </AppLayout>
  );
}