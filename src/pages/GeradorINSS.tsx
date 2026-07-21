import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSpreadsheet, Upload, Download, AlertTriangle, CheckCircle2, Loader2,
  Settings, History, Users, Wallet, FileText, ShieldAlert, Sparkles, FileDown,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useInssConfig, useUpdateInssConfig, useInssGenerations, useRecordGeneration } from "@/hooks/useInssConfig";

import { parsePayrollFile, type ParseResult, type RawPayrollRow } from "@/lib/inss/parser";
import {
  generateInssWorkbook, generateCsv, computeChecksum, downloadBlob,
  type InssEmployeeRow, type InssExportInput,
} from "@/lib/inss/generator";
import { generateSummaryPdf } from "@/lib/inss/summaryPdf";
import { ImportNissDialog } from "@/components/ImportNissDialog";
import { AnomalyPanel } from "@/components/inss/AnomalyPanel";

interface EnrichedRow extends RawPayrollRow {
  niss: string;
  matched: boolean;
  status: "ok" | "missing_niss" | "not_found";
  warnings: string[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function GeradorINSS() {
  const { user, role, isAdmin } = useAuth();
  const canAccess = isAdmin || role === "GESTOR_PROVINCIAL" || role === "GESTOR_MUNICIPAL";

  const { data: config } = useInssConfig();
  const updateConfig = useUpdateInssConfig();
  const { data: history } = useInssGenerations();
  const recordGen = useRecordGeneration();

  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [enriched, setEnriched] = useState<EnrichedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phase, setPhase] = useState<"idle" | "parsing" | "matching" | "ready" | "exporting">("idle");

  const [tipo, setTipo] = useState<"Normal" | "Complementar">("Normal");
  const [referenceMonth, setReferenceMonth] = useState(
    (() => {
      const d = new Date();
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    })()
  );
  const [smartUpdate, setSmartUpdate] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [importNissOpen, setImportNissOpen] = useState(false);

  const [empName, setEmpName] = useState("");
  const [empNiss, setEmpNiss] = useState("");
  const [empNif, setEmpNif] = useState("");

  // Load config into local state
  useMemo(() => {
    if (config) {
      setEmpName(config.employer_name);
      setEmpNiss(config.employer_niss);
      setEmpNif(config.employer_nif);
    }
  }, [config]);

  if (!user) return <Navigate to="/auth" replace />;
  if (!canAccess) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso restrito</AlertTitle>
            <AlertDescription>
              Apenas Administradores, Gestores Provinciais e Gestores Municipais podem gerar folhas INSS.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const handleFile = async (f: File) => {
    setFile(f);
    setIsProcessing(true);
    setPhase("parsing");
    setProgress(10);
    try {
      const result = await parsePayrollFile(f);
      setParseResult(result);
      setProgress(40);
      setPhase("matching");
      await matchEmployees(result);
      setPhase("ready");
      setProgress(100);
    } catch (e: any) {
      toast.error(`Erro ao processar: ${e.message ?? e}`);
      setPhase("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const matchEmployees = async (result: ParseResult) => {
    // Fetch all professores with numero_agente and niss in one call (bounded)
    const numeros = result.rows.map(r => r.numeroContribuinte);
    const chunks: string[][] = [];
    for (let i = 0; i < numeros.length; i += 500) chunks.push(numeros.slice(i, i + 500));

    const map = new Map<string, { niss: string | null; id: string; nome: string; status: string | null }>();
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("professores")
        .select("id, numero_agente, niss, nome, status")
        .in("numero_agente", chunk);
      if (error) throw error;
      (data ?? []).forEach((p: any) => {
        map.set(String(p.numero_agente), { niss: p.niss, id: p.id, nome: p.nome, status: p.status });
      });
    }

    // Optional Smart Update: sync niss where missing but source has it? Source doesn't have NISS,
    // so smart update in this direction can only refresh nome and last-seen. We update updated_at only.
    if (smartUpdate) {
      const toTouch = result.rows
        .map(r => map.get(r.numeroContribuinte))
        .filter(Boolean)
        .map((p: any) => p.id);
      if (toTouch.length > 0) {
        await supabase
          .from("professores")
          .update({ updated_at: new Date().toISOString() })
          .in("id", toTouch);
      }
    }

    const dupSet = new Set(result.duplicates);
    const rows: EnrichedRow[] = result.rows.map(r => {
      const found = map.get(r.numeroContribuinte);
      const warnings: string[] = [];
      let status: EnrichedRow["status"] = "ok";
      let niss = "";
      if (!found) {
        status = "not_found";
        warnings.push("Agente não encontrado na base");
      } else {
        niss = found.niss ?? "";
        if (!niss) { status = "missing_niss"; warnings.push("Sem Inscrição INSS"); }
        if (found.status && found.status !== "ativo") warnings.push(`Estado: ${found.status}`);
      }
      if (dupSet.has(r.numeroContribuinte)) warnings.push("Nº duplicado no ficheiro");
      return { ...r, niss, matched: !!found, status, warnings };
    });
    setEnriched(rows);
  };

  const editNiss = (idx: number, value: string) => {
    setEnriched(prev => prev.map((r, i) => i === idx ? {
      ...r,
      niss: value,
      status: value ? "ok" : (r.matched ? "missing_niss" : "not_found"),
      warnings: value ? r.warnings.filter(w => w !== "Sem Inscrição INSS") : r.warnings,
    } : r));
  };

  const stats = useMemo(() => {
    const missing = enriched.filter(r => !r.niss).length;
    return {
      totalRead: parseResult?.rows.length ?? 0,
      validEmployees: enriched.filter(r => r.status === "ok").length,
      missingNiss: missing,
      duplicates: parseResult?.duplicates.length ?? 0,
      ignoredRows: parseResult?.ignoredRows ?? 0,
      invalidRows: parseResult?.invalidRows.length ?? 0,
      totalBase: parseResult?.totals.base ?? 0,
      totalAdicionais: parseResult?.totals.adicionais ?? 0,
      totalBruto: parseResult?.totals.bruto ?? 0,
    };
  }, [enriched, parseResult]);

  const buildExportInput = (): InssExportInput => ({
    tipo,
    referenceMonth,
    employerName: empName || config?.employer_name || "",
    employerNiss: empNiss || config?.employer_niss || "",
    employerNif: empNif || config?.employer_nif || "",
    rows: enriched.map<InssEmployeeRow>(r => ({
      niss: r.niss,
      nome: r.nome,
      vencimentoBase: r.vencimentoBase,
      additional: r.additional,
      totalAbonos: r.totalAbonos,
      missingNiss: !r.niss,
    })),
  });

  const recordAudit = async (format: string, checksum: string) => {
    await recordGen.mutateAsync({
      generated_by: user.id,
      reference_month: referenceMonth,
      tipo,
      source_filename: file?.name ?? null,
      employer_name: empName,
      employer_niss: empNiss,
      employer_nif: empNif,
      total_employees: stats.totalRead,
      employees_matched: enriched.filter(r => r.matched).length,
      employees_missing_niss: stats.missingNiss,
      duplicates: stats.duplicates,
      ignored_rows: stats.ignoredRows,
      total_base: stats.totalBase,
      total_adicionais: stats.totalAdicionais,
      total_bruto: stats.totalBruto,
      export_format: format,
      checksum,
      version: "1.0.0",
    });
  };

  const exportXlsx = async () => {
    setPhase("exporting");
    try {
      const input = buildExportInput();
      const buf = await generateInssWorkbook(input);
      const checksum = await computeChecksum(buf);
      const name = `FRN_${referenceMonth.replace("/", "-")}_${tipo}.xlsx`;
      downloadBlob(buf, name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      await recordAudit("xlsx", checksum);
      toast.success(`Ficheiro INSS gerado (${enriched.length} agentes)`);
    } catch (e: any) {
      toast.error(`Erro no export: ${e.message ?? e}`);
    } finally {
      setPhase("ready");
    }
  };

  const exportCsv = async () => {
    const input = buildExportInput();
    const csv = generateCsv(input);
    downloadBlob(csv, `FRN_${referenceMonth.replace("/", "-")}.csv`, "text/csv;charset=utf-8");
    const enc = new TextEncoder().encode(csv);
    await recordAudit("csv", await computeChecksum(enc.buffer as ArrayBuffer));
    toast.success("CSV exportado");
  };

  const exportPdf = async () => {
    const input = buildExportInput();
    const blob = generateSummaryPdf(input, stats);
    const buf = await blob.arrayBuffer();
    downloadBlob(buf, `FRN_${referenceMonth.replace("/", "-")}_Sumario.pdf`, "application/pdf");
    await recordAudit("pdf", await computeChecksum(buf));
    toast.success("Sumário PDF exportado");
  };

  const saveConfig = async () => {
    if (!config) return;
    await updateConfig.mutateAsync({
      id: config.id,
      employer_name: empName,
      employer_niss: empNiss,
      employer_nif: empNif,
    });
    toast.success("Configuração guardada");
    setConfigOpen(false);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Gerador INSS — Folha de Remuneração"
            description="Converte automaticamente a Folha de Pagamento por Unidade Pagadora no ficheiro oficial INSS."
            icon={<FileSpreadsheet className="h-6 w-6" />}
          />
          <Button variant="outline" onClick={() => setImportNissOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar NISS em massa
          </Button>
        </div>
        <ImportNissDialog open={importNissOpen} onOpenChange={setImportNissOpen} />

        {/* Configuration + Upload */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> 1. Importar Folha de Pagamento
              </CardTitle>
              <CardDescription>Aceita ficheiros .xlsx do Sistema Integrado de Gestão Financeira.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Mês de Referência</Label>
                  <Input value={referenceMonth} onChange={e => setReferenceMonth(e.target.value)} placeholder="MM/AAAA" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={v => setTipo(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Complementar">Complementar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={smartUpdate} onCheckedChange={setSmartUpdate} id="smart" />
                  <Label htmlFor="smart" className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Smart Update
                  </Label>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition">
                <input
                  type="file"
                  accept=".xlsx"
                  id="payroll-file"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <label htmlFor="payroll-file" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="font-medium">
                    {file ? file.name : "Clique para carregar a Folha de Pagamento (.xlsx)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Cabeçalhos, subtotais e totais são detectados e ignorados automaticamente
                  </span>
                </label>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {phase === "parsing" && "A analisar folha…"}
                    {phase === "matching" && "A cruzar com a base de agentes…"}
                    {phase === "exporting" && "A gerar ficheiro INSS…"}
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Contribuinte</CardTitle>
              <CardDescription>Dados do empregador no INSS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Nome</Label><Input value={empName} onChange={e => setEmpName(e.target.value)} /></div>
              <div><Label>NISS</Label><Input value={empNiss} onChange={e => setEmpNiss(e.target.value)} /></div>
              <div><Label>NIF</Label><Input value={empNif} onChange={e => setEmpNif(e.target.value)} /></div>
              {isAdmin && (
                <Button onClick={saveConfig} variant="outline" size="sm" className="w-full">
                  Guardar como padrão
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reconciliation Dashboard */}
        {parseResult && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} label="Agentes Lidos" value={stats.totalRead.toString()} />
              <StatCard icon={CheckCircle2} label="Válidos" value={stats.validEmployees.toString()} tone="success" />
              <StatCard icon={AlertTriangle} label="Sem INSS" value={stats.missingNiss.toString()} tone="warning" />
              <StatCard icon={FileText} label="Ignoradas" value={(stats.ignoredRows + stats.invalidRows).toString()} />
              <StatCard icon={Wallet} label="Total Base" value={fmt(stats.totalBase)} />
              <StatCard icon={Wallet} label="Total Adicionais" value={fmt(stats.totalAdicionais)} />
              <StatCard icon={Wallet} label="Total Bruto" value={fmt(stats.totalBruto)} tone="primary" />
              <StatCard icon={ShieldAlert} label="Duplicados" value={stats.duplicates.toString()} tone={stats.duplicates > 0 ? "warning" : "muted"} />
            </div>

            {stats.missingNiss > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{stats.missingNiss} agente(s) sem Inscrição INSS</AlertTitle>
                <AlertDescription>
                  Pode editar o campo INSS diretamente na tabela abaixo antes de exportar.
                  O ficheiro será exportado com estas linhas destacadas a amarelo e o campo INSS vazio.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Pré-visualização Editável</TabsTrigger>
                <TabsTrigger value="anomalies">
                  <Activity className="h-4 w-4 mr-1" /> Anomalias
                </TabsTrigger>
                <TabsTrigger value="missing">Sem INSS ({stats.missingNiss})</TabsTrigger>
                <TabsTrigger value="invalid">Linhas Inválidas ({stats.invalidRows})</TabsTrigger>
                <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="anomalies">
                <AnomalyPanel rows={enriched} />
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Pré-visualização</CardTitle>
                      <CardDescription>{enriched.length} linhas prontas para exportação</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportXlsx} disabled={phase === "exporting"}>
                        {phase === "exporting" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar Excel INSS
                      </Button>
                      <Button variant="outline" onClick={exportCsv}><FileDown className="h-4 w-4 mr-2" />CSV</Button>
                      <Button variant="outline" onClick={exportPdf}><FileText className="h-4 w-4 mr-2" />PDF Sumário</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Nº Agente</TableHead>
                            <TableHead>Inscrição INSS</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-right">Base</TableHead>
                            <TableHead className="text-right">Adicionais</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enriched.map((r, i) => (
                            <TableRow key={i} className={!r.niss ? "bg-yellow-50 dark:bg-yellow-950/30" : ""}>
                              <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{r.numeroContribuinte}</TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 w-32 font-mono text-xs"
                                  value={r.niss}
                                  onChange={e => editNiss(i, e.target.value.trim())}
                                  placeholder="—"
                                />
                              </TableCell>
                              <TableCell className="max-w-[240px] truncate">{r.nome}</TableCell>
                              <TableCell className="text-right font-mono">{fmt(r.vencimentoBase)}</TableCell>
                              <TableCell className="text-right font-mono">{fmt(r.additional)}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">{fmt(r.totalAbonos)}</TableCell>
                              <TableCell>
                                {r.status === "ok" && <Badge variant="secondary" className="bg-green-100 text-green-800">OK</Badge>}
                                {r.status === "missing_niss" && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Sem INSS</Badge>}
                                {r.status === "not_found" && <Badge variant="destructive">Não encontrado</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="missing">
                <Card><CardContent className="pt-6">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Nº Agente</TableHead><TableHead>Nome</TableHead><TableHead>Motivo</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {enriched.filter(r => !r.niss).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{r.numeroContribuinte}</TableCell>
                          <TableCell>{r.nome}</TableCell>
                          <TableCell>{r.status === "not_found" ? "Agente não existe na base" : "Agente sem NISS registado"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="invalid">
                <Card><CardContent className="pt-6">
                  <Table>
                    <TableHeader><TableRow><TableHead>Linha</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {parseResult.invalidRows.map((r, i) => (
                        <TableRow key={i}><TableCell>{r.rowIndex}</TableCell><TableCell>{r.reason}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="history">
                <Card><CardContent className="pt-6">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Data</TableHead><TableHead>Mês</TableHead><TableHead>Tipo</TableHead>
                      <TableHead>Agentes</TableHead><TableHead>Sem INSS</TableHead>
                      <TableHead className="text-right">Total Bruto</TableHead><TableHead>Formato</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(history ?? []).map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs">{new Date(h.generated_at).toLocaleString("pt-PT")}</TableCell>
                          <TableCell>{h.reference_month}</TableCell>
                          <TableCell>{h.tipo}</TableCell>
                          <TableCell>{h.total_employees}</TableCell>
                          <TableCell>{h.employees_missing_niss}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(Number(h.total_bruto))}</TableCell>
                          <TableCell><Badge variant="outline">{h.export_format.toUpperCase()}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {(history ?? []).length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem gerações registadas</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, tone = "muted" }: {
  icon: any; label: string; value: string; tone?: "muted" | "success" | "warning" | "primary";
}) {
  const tones: Record<string, string> = {
    muted: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    primary: "text-primary",
  };
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-1 text-xs uppercase tracking-wider text-muted-foreground">
          <Icon className={`h-4 w-4 ${tones[tone]}`} /> {label}
        </div>
        <div className="text-2xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}
