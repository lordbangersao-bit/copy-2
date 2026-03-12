import { useState } from "react";
import * as XLSX from "xlsx";
import { getOfficialPrintHTML, openPrintWindow } from "@/lib/printTemplate";
import { calcularIdade, calcularTempoServico, calcularTempoServicoAnos } from "@/lib/calcularAgente";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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

import { EmissaoDocumentosDialog } from "@/components/EmissaoDocumentosDialog";
import { ImportAgentesDialog } from "@/components/ImportAgentesDialog";
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
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Eye,
  
  Lock,
  Filter,
  Download,
  MoreHorizontal,
  AlertTriangle,
  FileText,
  FileDown,
  Upload,
  Printer,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

export default function Professores() {
  const { isAdmin } = useAuth();
  const { data: escolas } = useEscolas();
  const [escolaFilter, setEscolaFilter] = useState<string>("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [funcaoFilter, setFuncaoFilter] = useState<string>("");
  const [generoFilter, setGeneroFilter] = useState<string>("");
  const [condicaoFisicaFilter, setCondicaoFisicaFilter] = useState<string>("");
  const [disciplinaFilter, setDisciplinaFilter] = useState<string>("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { data: professores, isLoading, error } = useProfessores(
    escolaFilter || undefined
  );
  const createProfessor = useCreateProfessor();
  const updateProfessor = useUpdateProfessor();
  const deleteProfessor = useDeleteProfessor();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingProfessor, setViewingProfessor] = useState<ProfessorWithEscola | null>(null);
  
  const [importOpen, setImportOpen] = useState(false);
  const [emissaoProfessor, setEmissaoProfessor] = useState<ProfessorWithEscola | null>(null);

  // Extract unique values for filter options
  const uniqueCategorias = [...new Set(professores?.map(p => p.categoria).filter(Boolean) as string[])].sort();
  const uniqueFuncoes = [...new Set(professores?.map(p => p.funcao).filter(Boolean) as string[])].sort();
  const uniqueGeneros = [...new Set(professores?.map(p => p.genero).filter(Boolean) as string[])].sort();
  const uniqueCondicoes = [...new Set(professores?.map(p => p.condicao_fisica).filter(Boolean) as string[])].sort();
  const uniqueDisciplinas = [...new Set(professores?.map(p => p.disciplina).filter(Boolean) as string[])].sort();

  const activeFilterCount = [categoriaFilter, funcaoFilter, generoFilter, condicaoFisicaFilter, disciplinaFilter].filter(f => f && f !== "all").length;

  // Retirement alert: age >= 65 or service time >= 35 years
  const agentesReforma = professores?.filter((p) => {
    const idade = calcularIdade(p.data_nascimento);
    const anosServico = calcularTempoServicoAnos(p.data_admissao);
    return (idade !== null && idade >= 65) || anosServico >= 35;
  }) || [];

  const [showReformaAlert, setShowReformaAlert] = useState(true);

  const clearAllFilters = () => {
    setCategoriaFilter("");
    setFuncaoFilter("");
    setGeneroFilter("");
    setCondicaoFisicaFilter("");
    setDisciplinaFilter("");
    setEscolaFilter("");
    setSearch("");
  };

  const filteredProfessores = professores?.filter((professor) => {
    const matchesSearch =
      !search ||
      professor.nome.toLowerCase().includes(search.toLowerCase()) ||
      professor.funcao?.toLowerCase().includes(search.toLowerCase()) ||
      professor.numero_agente?.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria = !categoriaFilter || categoriaFilter === "all" || professor.categoria === categoriaFilter;
    const matchesFuncao = !funcaoFilter || funcaoFilter === "all" || professor.funcao === funcaoFilter;
    const matchesGenero = !generoFilter || generoFilter === "all" || professor.genero === generoFilter;
    const matchesCondicao = !condicaoFisicaFilter || condicaoFisicaFilter === "all" || professor.condicao_fisica === condicaoFisicaFilter;
    const matchesDisciplina = !disciplinaFilter || disciplinaFilter === "all" || professor.disciplina === disciplinaFilter;
    return matchesSearch && matchesCategoria && matchesFuncao && matchesGenero && matchesCondicao && matchesDisciplina;
  });

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
    if (!isAdmin) return;
    setEditingProfessor(professor);
    setFormOpen(true);
  };

  const downloadFicha = (professor: ProfessorWithEscola, tipo: "completa" | "resumida") => {
    const val = (v: string | number | boolean | null | undefined): string =>
      v === true ? "Sim" : v === false ? "Não" : v != null ? String(v) : "-";

    const title = tipo === "completa" ? "FICHA COMPLETA DO AGENTE" : "FICHA RESUMIDA DO AGENTE";

    const row = (label: string, value: string) =>
      `<tr><td style="font-weight:600;width:200px;background:#f8f9fa;">${label}</td><td>${value}</td></tr>`;

    const sectionTitle = (name: string) =>
      `<h2 style="font-size:13pt;font-weight:bold;margin:20px 0 10px;border-left:4px solid #1a365d;padding-left:10px;">${name}</h2>`;

    let tableContent = "";

    if (tipo === "completa") {
      tableContent = `
        ${sectionTitle("Identificação")}
        <table>${[
          row("Nº de Cadastro", val(professor.numero_cadastro)),
          row("Nº Agente", val(professor.numero_agente)),
          row("Nome Completo", val(professor.nome)),
          row("Data de Nascimento", val(professor.data_nascimento)),
          row("Idade", calcularIdade(professor.data_nascimento) !== null ? `${calcularIdade(professor.data_nascimento)} anos` : "-"),
          row("Género", val(professor.genero)),
          row("Documento (BI)", val(professor.cpf)),
          row("Estado Civil", val(professor.estado_civil)),
          row("Telefone", val(professor.telefone)),
          row("Email", val(professor.email)),
          row("Condição Física", val(professor.condicao_fisica)),
          row("Estado de Saúde", val(professor.estado_saude)),
        ].join("")}</table>

        ${sectionTitle("Dados Profissionais")}
        <table>${[
          row("Função", val(professor.funcao)),
          row("Categoria", val(professor.categoria)),
          row("Local de Trabalho", val(professor.escolas?.nome)),
          row("Nível Académico", val(professor.nivel_academico)),
          row("Formado em", val(professor.formado_em)),
          row("Disciplina", val(professor.disciplina)),
          row("Regime de Contrato", val(professor.regime_contrato)),
          row("Data de Admissão", val(professor.data_admissao)),
          row("Início de Função", val(professor.inicio_funcao)),
          row("Tempo de Serviço", val(calcularTempoServico(professor.data_admissao))),
          row("Proc. Disciplinares", val(professor.qtd_processo_disciplinar)),
          row("Actividade", val(professor.actividade)),
          row("Agente Transferido", val(professor.agente_transferido)),
          row("Arquivo Pessoal", val(professor.arquivo_pessoal)),
        ].join("")}</table>

        ${sectionTitle("Localização")}
        <table>${[
          row("Província", val(professor.provincia)),
          row("Comuna", val(professor.comuna)),
          row("Bairro / Localidade", val(professor.bairro_localidade)),
        ].join("")}</table>

        ${sectionTitle("Dados Familiares")}
        <table>${[
          row("Dependentes", val(professor.dependentes)),
          row("Nº de Dependentes", val(professor.num_dependentes)),
          row("Nome do(a) Parceiro(a)", val(professor.nome_parceira)),
          row("Tel. Parceiro(a)", val(professor.telefone_parceira)),
          row("Outro Familiar", val(professor.outro_familiar)),
        ].join("")}</table>
      `;
    } else {
      tableContent = `
        <table>${[
          row("Nome", val(professor.nome)),
          row("Nº Agente", val(professor.numero_agente)),
          row("Nº de Cadastro", val(professor.numero_cadastro)),
          row("Documento (BI)", val(professor.cpf)),
          row("Telefone", val(professor.telefone)),
          row("Género", val(professor.genero)),
          row("Função", val(professor.funcao)),
          row("Categoria", val(professor.categoria)),
          row("Local de Trabalho", val(professor.escolas?.nome)),
          row("Data de Admissão", val(professor.data_admissao)),
          row("Tempo de Serviço", val(calcularTempoServico(professor.data_admissao))),
          row("Actividade", val(professor.actividade)),
        ].join("")}</table>
      `;
    }

    const html = getOfficialPrintHTML({
      title,
      content: tableContent,
    });
    openPrintWindow(html);
  };

  const exportToExcel = () => {
    const data = (filteredProfessores || []).map((p) => ({
      "Nº Agente": p.numero_agente || "",
      "Nº Cadastro": p.numero_cadastro || "",
      "Nome": p.nome,
      "Género": p.genero || "",
      "Idade": calcularIdade(p.data_nascimento) || "",
      "Data de Nascimento": p.data_nascimento || "",
      "Documento (BI)": p.cpf || "",
      "Estado Civil": p.estado_civil || "",
      "Telefone": p.telefone || "",
      "Email": p.email || "",
      "Função": p.funcao || "",
      "Categoria": p.categoria || "",
      "Local de Trabalho": p.escolas?.nome || "",
      "Nível Académico": p.nivel_academico || "",
      "Formado em": p.formado_em || "",
      "Disciplina": p.disciplina || "",
      "Regime de Contrato": p.regime_contrato || "",
      "Data de Admissão": p.data_admissao || "",
      "Início de Função": p.inicio_funcao || "",
      "Tempo de Serviço": calcularTempoServico(p.data_admissao) || "",
      "Actividade": p.actividade || "",
      "Condição Física": p.condicao_fisica || "",
      "Estado de Saúde": p.estado_saude || "",
      "Agente Transferido": p.agente_transferido ? "Sim" : "Não",
      "Proc. Disciplinares": p.qtd_processo_disciplinar || 0,
      "Província": p.provincia || "",
      "Comuna": p.comuna || "",
      "Bairro / Localidade": p.bairro_localidade || "",
      "Dependentes": p.dependentes || "",
      "Nº Dependentes": p.num_dependentes || 0,
      "Nome Parceiro(a)": p.nome_parceira || "",
      "Tel. Parceiro(a)": p.telefone_parceira || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agentes");

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((r) => String((r as Record<string, unknown>)[key] || "").length)).toString().length + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `agentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | boolean | null | undefined;
  }) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">
        {value === true ? "Sim" : value === false ? "Não" : value || "-"}
      </p>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Agentes"
          description="Gestão dos agentes da educação do município"
          icon={<Users className="h-6 w-6" />}
          badge={
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
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!filteredProfessores?.length}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button onClick={() => setFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agente
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
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Agentes
                  </p>
                  <p className="text-2xl font-bold">
                    {professores?.length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Activos
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {professores?.filter(
                      (p) =>
                        p.actividade?.toLowerCase() === "activo" ||
                        p.status === "ativo"
                    ).length || 0}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-success/10" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Afastados / Licença
                  </p>
                  <p className="text-2xl font-bold text-warning">
                    {professores?.filter(
                      (p) =>
                        p.actividade?.toLowerCase() !== "activo" &&
                        p.status !== "ativo"
                    ).length || 0}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-warning/10" />
              </div>
            </CardContent>
          </Card>
          <Card className={agentesReforma.length > 0 ? "border-destructive/30" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Para Reforma
                  </p>
                  <p className={`text-2xl font-bold ${agentesReforma.length > 0 ? "text-destructive" : ""}`}>
                    {agentesReforma.length}
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${agentesReforma.length > 0 ? "text-destructive/40" : "text-muted/20"}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retirement Alert */}
        {agentesReforma.length > 0 && showReformaAlert && (
          <Alert className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-destructive">
                  ⚠ {agentesReforma.length} agente(s) em condições de reforma
                </span>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setShowReformaAlert(false)}>
                  Fechar
                </Button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {agentesReforma.map((a) => {
                  const reasons: string[] = [];
                  const idadeCalc = calcularIdade(a.data_nascimento);
                  const anosServico = calcularTempoServicoAnos(a.data_admissao);
                  if (idadeCalc !== null && idadeCalc >= 65) reasons.push(`Idade: ${idadeCalc} anos`);
                  if (anosServico >= 35) reasons.push(`Tempo de serviço: ${anosServico} anos`);
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-background/50 rounded px-3 py-1.5">
                      <div>
                        <span className="font-medium">{a.nome}</span>
                        {a.numero_agente && <span className="text-muted-foreground ml-2">#{a.numero_agente}</span>}
                      </div>
                      <span className="text-xs text-destructive">{reasons.join(" | ")}</span>
                    </div>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, função ou nº agente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={escolaFilter} onValueChange={setEscolaFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Local de trabalho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os locais</SelectItem>
                  {escolas?.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showMoreFilters ? "secondary" : "outline"}
                size="sm"
                className="gap-2 whitespace-nowrap"
                onClick={() => setShowMoreFilters(!showMoreFilters)}
              >
                <Filter className="h-4 w-4" />
                Mais Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showMoreFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t">
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {uniqueCategorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={funcaoFilter} onValueChange={setFuncaoFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas funções</SelectItem>
                    {uniqueFuncoes.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={generoFilter} onValueChange={setGeneroFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos géneros</SelectItem>
                    {uniqueGeneros.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={condicaoFisicaFilter} onValueChange={setCondicaoFisicaFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Condição Física" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas condições</SelectItem>
                    {uniqueCondicoes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={disciplinaFilter} onValueChange={setDisciplinaFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas disciplinas</SelectItem>
                    {uniqueDisciplinas.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive col-span-2 sm:col-span-1">
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
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
          ) : filteredProfessores && filteredProfessores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Nº Agente</TableHead>
                  <TableHead className="font-semibold">Agente</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">
                    Função
                  </TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">
                    Local de Trabalho
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">
                    Categoria
                  </TableHead>
                  <TableHead className="font-semibold">Situação</TableHead>
                  <TableHead className="w-20 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessores.map((professor) => (
                  <TableRow key={professor.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {professor.numero_agente || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                          <Users className="h-5 w-5 text-secondary" />
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
                      <span className="max-w-[200px] truncate block">
                        {professor.escolas?.nome || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {professor.categoria || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={professor.actividade || professor.status || "activo"}
                      />
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
                            onClick={() => setViewingProfessor(professor)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setEmissaoProfessor(professor)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Emissão de Documentos
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => downloadFicha(professor, "completa")}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ficha Completa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => downloadFicha(professor, "resumida")}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Ficha Resumida
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEdit(professor)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(professor.id)}
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
              type={search || escolaFilter ? "no-results" : "empty"}
              title={
                search || escolaFilter
                  ? "Nenhum agente encontrado"
                  : "Nenhum agente cadastrado"
              }
              description={
                search || escolaFilter
                  ? "Tente ajustar os filtros de pesquisa"
                  : "Comece adicionando o primeiro agente ao sistema"
              }
              action={
                !search && !escolaFilter && isAdmin
                  ? {
                      label: "Cadastrar Agente",
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
        open={!!viewingProfessor}
        onOpenChange={(open) => !open && setViewingProfessor(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Detalhes do Agente
            </DialogTitle>
          </DialogHeader>
          {viewingProfessor && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Identificação */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Identificação
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem
                      label="Nº de Cadastro"
                      value={viewingProfessor.numero_cadastro}
                    />
                    <DetailItem
                      label="Nº Agente"
                      value={viewingProfessor.numero_agente}
                    />
                    <DetailItem label="Nome" value={viewingProfessor.nome} />
                    <DetailItem
                      label="Data de Nascimento"
                      value={viewingProfessor.data_nascimento}
                    />
                    <DetailItem label="Idade" value={calcularIdade(viewingProfessor.data_nascimento) !== null ? `${calcularIdade(viewingProfessor.data_nascimento)} anos` : null} />
                    <DetailItem label="Género" value={viewingProfessor.genero} />
                    <DetailItem label="Documento" value={viewingProfessor.cpf} />
                    <DetailItem
                      label="Estado Civil"
                      value={viewingProfessor.estado_civil}
                    />
                    <DetailItem
                      label="Telefone"
                      value={viewingProfessor.telefone}
                    />
                    <DetailItem label="Email" value={viewingProfessor.email} />
                    <DetailItem
                      label="Condição Física"
                      value={viewingProfessor.condicao_fisica}
                    />
                    <DetailItem
                      label="Estado de Saúde"
                      value={viewingProfessor.estado_saude}
                    />
                  </div>
                </div>

                {/* Profissional */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Dados Profissionais
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem label="Função" value={viewingProfessor.funcao} />
                    <DetailItem
                      label="Categoria"
                      value={viewingProfessor.categoria}
                    />
                    <DetailItem
                      label="Local de Trabalho"
                      value={viewingProfessor.escolas?.nome}
                    />
                    <DetailItem
                      label="Nível Académico"
                      value={viewingProfessor.nivel_academico}
                    />
                    <DetailItem
                      label="Formado em"
                      value={viewingProfessor.formado_em}
                    />
                    <DetailItem
                      label="Disciplina"
                      value={viewingProfessor.disciplina}
                    />
                    <DetailItem
                      label="Regime de Contrato"
                      value={viewingProfessor.regime_contrato}
                    />
                    <DetailItem
                      label="Início de Função"
                      value={viewingProfessor.inicio_funcao}
                    />
                    <DetailItem
                      label="Tempo de Serviço"
                      value={calcularTempoServico(viewingProfessor.data_admissao)}
                    />
                    <DetailItem
                      label="Processos Disciplinares"
                      value={viewingProfessor.qtd_processo_disciplinar}
                    />
                    <DetailItem
                      label="Actividade"
                      value={viewingProfessor.actividade}
                    />
                    <DetailItem
                      label="Agente Transferido"
                      value={viewingProfessor.agente_transferido}
                    />
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Localização
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem
                      label="Província"
                      value={viewingProfessor.provincia}
                    />
                    <DetailItem label="Comuna" value={viewingProfessor.comuna} />
                    <DetailItem
                      label="Bairro / Localidade"
                      value={viewingProfessor.bairro_localidade}
                    />
                  </div>
                </div>

                {/* Família */}
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <div className="h-1 w-4 bg-primary rounded" />
                    Dados Familiares
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <DetailItem
                      label="Dependentes"
                      value={viewingProfessor.dependentes}
                    />
                    <DetailItem
                      label="Nº de Dependentes"
                      value={viewingProfessor.num_dependentes}
                    />
                    <DetailItem
                      label="Nome do(a) Parceiro(a)"
                      value={viewingProfessor.nome_parceira}
                    />
                    <DetailItem
                      label="Telefone Parceiro(a)"
                      value={viewingProfessor.telefone_parceira}
                    />
                    <DetailItem
                      label="Outro Familiar"
                      value={viewingProfessor.outro_familiar}
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
        </>
      )}


      {/* Emissão de Documentos Dialog */}
      <EmissaoDocumentosDialog
        professor={emissaoProfessor}
        open={!!emissaoProfessor}
        onOpenChange={(open) => !open && setEmissaoProfessor(null)}
      />

      {/* Import Dialog */}
      <ImportAgentesDialog open={importOpen} onOpenChange={setImportOpen} />
    </AppLayout>
  );
}