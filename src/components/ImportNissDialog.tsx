import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download,
} from "lucide-react";

interface ImportNissDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Row {
  numero_agente: string;
  niss: string;
  nome_ficheiro?: string;
  status: "novo" | "atualizar" | "igual" | "nao_encontrado" | "invalido";
  motivo?: string;
  id?: string;
  niss_actual?: string | null;
  nome_actual?: string | null;
}

const NISS_RE = /^[0-9A-Z\/\-]{6,20}$/i;

function normalizeHeader(h: string) {
  return String(h ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function detectCol(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const n = normalizeHeader(c);
    const idx = norm.findIndex((h) => h === n || h.includes(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function ImportNissDialog({ open, onOpenChange }: ImportNissDialogProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<Row[]>([]);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [updated, setUpdated] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [errors, setErrors] = useState(0);

  const reset = () => {
    setStep("upload");
    setRows([]);
    setProgress(0);
    setFileName("");
    setUpdated(0);
    setSkipped(0);
    setErrors(0);
  };

  const summary = useMemo(() => ({
    total: rows.length,
    novos: rows.filter((r) => r.status === "novo").length,
    atualizar: rows.filter((r) => r.status === "atualizar").length,
    iguais: rows.filter((r) => r.status === "igual").length,
    naoEnc: rows.filter((r) => r.status === "nao_encontrado").length,
    invalidos: rows.filter((r) => r.status === "invalido").length,
  }), [rows]);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["numero_agente", "niss", "nome"],
      ["12345", "0123456789", "Exemplo Silva"],
    ]);
    ws["!cols"] = [{ wch: 18 }, { wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, "NISS");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-niss.xlsx";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (aoa.length < 2) {
        toast.error("Ficheiro vazio ou sem dados.");
        return;
      }

      // Find header row within first 5 rows
      let headerIdx = 0;
      for (let i = 0; i < Math.min(5, aoa.length); i++) {
        const norm = aoa[i].map((c) => normalizeHeader(String(c)));
        if (norm.some((h) => h.includes("agente") || h.includes("cadastro")) &&
            norm.some((h) => h.includes("niss") || h.includes("inss") || h.includes("contribuinte"))) {
          headerIdx = i;
          break;
        }
      }

      const headers = aoa[headerIdx].map((c) => String(c));
      const colAgente = detectCol(headers, ["numero_agente", "numeroagente", "nagente", "agente", "matricula", "cadastro"]);
      const colNiss = detectCol(headers, ["niss", "inss", "numerocontribuinte", "contribuinte", "inscricaoinss"]);
      const colNome = detectCol(headers, ["nome", "agentenome"]);

      if (colAgente < 0 || colNiss < 0) {
        toast.error("Colunas obrigatórias em falta: numero_agente e niss.");
        return;
      }

      const parsed: Row[] = [];
      const seen = new Set<string>();
      for (let i = headerIdx + 1; i < aoa.length; i++) {
        const r = aoa[i];
        const numero = String(r[colAgente] ?? "").trim();
        const niss = String(r[colNiss] ?? "").trim().replace(/\s+/g, "");
        const nome = colNome >= 0 ? String(r[colNome] ?? "").trim() : "";
        if (!numero && !niss) continue;
        if (!numero) {
          parsed.push({ numero_agente: "", niss, nome_ficheiro: nome, status: "invalido", motivo: "Sem Nº de Agente" });
          continue;
        }
        if (!niss) {
          parsed.push({ numero_agente: numero, niss: "", nome_ficheiro: nome, status: "invalido", motivo: "Sem NISS" });
          continue;
        }
        if (!NISS_RE.test(niss)) {
          parsed.push({ numero_agente: numero, niss, nome_ficheiro: nome, status: "invalido", motivo: "Formato NISS inválido" });
          continue;
        }
        if (seen.has(numero)) {
          parsed.push({ numero_agente: numero, niss, nome_ficheiro: nome, status: "invalido", motivo: "Nº de Agente duplicado no ficheiro" });
          continue;
        }
        seen.add(numero);
        parsed.push({ numero_agente: numero, niss, nome_ficheiro: nome, status: "novo" });
      }

      if (parsed.length === 0) {
        toast.error("Nenhuma linha válida encontrada.");
        return;
      }

      // Match against DB in batches
      const validNumbers = parsed.filter((p) => p.numero_agente).map((p) => p.numero_agente);
      const dbMap = new Map<string, { id: string; niss: string | null; nome: string }>();
      const chunk = 500;
      for (let i = 0; i < validNumbers.length; i += chunk) {
        const slice = validNumbers.slice(i, i + chunk);
        const { data, error } = await supabase
          .from("professores")
          .select("id, numero_agente, niss, nome")
          .in("numero_agente", slice);
        if (error) throw error;
        for (const p of data ?? []) {
          if (p.numero_agente) dbMap.set(p.numero_agente, { id: p.id, niss: (p as any).niss ?? null, nome: p.nome });
        }
      }

      for (const row of parsed) {
        if (row.status === "invalido") continue;
        const found = dbMap.get(row.numero_agente);
        if (!found) {
          row.status = "nao_encontrado";
          row.motivo = "Agente não existe no sistema";
          continue;
        }
        row.id = found.id;
        row.nome_actual = found.nome;
        row.niss_actual = found.niss;
        if ((found.niss ?? "").trim().toUpperCase() === row.niss.toUpperCase()) {
          row.status = "igual";
        } else if (found.niss && found.niss.trim() !== "") {
          row.status = "atualizar";
        } else {
          row.status = "novo";
        }
      }

      setRows(parsed);
      setStep("preview");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler ficheiro: " + (err as Error).message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setProgress(0);
    const toApply = rows.filter((r) => (r.status === "novo" || r.status === "atualizar") && r.id);
    let ok = 0;
    let err = 0;
    for (let i = 0; i < toApply.length; i++) {
      const row = toApply[i];
      const { error } = await supabase
        .from("professores")
        .update({ niss: row.niss })
        .eq("id", row.id!);
      if (error) {
        err++;
        row.motivo = error.message;
      } else {
        ok++;
      }
      setProgress(Math.round(((i + 1) / toApply.length) * 100));
    }
    setUpdated(ok);
    setErrors(err);
    setSkipped(rows.length - toApply.length);
    qc.invalidateQueries({ queryKey: ["professores"] });
    setStep("done");
    if (ok > 0) toast.success(`${ok} NISS atualizados no sistema.`);
    if (err > 0) toast.error(`${err} linhas falharam.`);
  };

  const badge = (s: Row["status"]) => {
    switch (s) {
      case "novo": return <Badge className="bg-emerald-600">Novo</Badge>;
      case "atualizar": return <Badge className="bg-amber-600">Substituir</Badge>;
      case "igual": return <Badge variant="secondary">Sem alteração</Badge>;
      case "nao_encontrado": return <Badge variant="destructive">Não encontrado</Badge>;
      case "invalido": return <Badge variant="outline" className="text-destructive border-destructive">Inválido</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importação em massa de NISS
          </DialogTitle>
          <DialogDescription>
            Atualiza o NISS dos agentes existentes através de um ficheiro Excel/CSV.
            Correspondência feita exclusivamente pelo <strong>Número de Agente</strong>.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                O ficheiro deve conter, no mínimo, duas colunas: <code>numero_agente</code> e <code>niss</code>.
                Aceita variações como "Nº de Agente", "Nº Contribuinte" ou "Inscrição INSS".
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Descarregar template
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Escolher ficheiro
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nenhum agente é criado nem eliminado — apenas o campo NISS é atualizado.
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Total: {summary.total}</Badge>
              <Badge className="bg-emerald-600">Novos: {summary.novos}</Badge>
              <Badge className="bg-amber-600">Substituir: {summary.atualizar}</Badge>
              <Badge variant="secondary">Sem alteração: {summary.iguais}</Badge>
              <Badge variant="destructive">Não encontrados: {summary.naoEnc}</Badge>
              <Badge variant="outline" className="text-destructive border-destructive">Inválidos: {summary.invalidos}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Ficheiro: {fileName}</p>
            <ScrollArea className="h-[45vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Agente</TableHead>
                    <TableHead>Nome (BD)</TableHead>
                    <TableHead>NISS actual</TableHead>
                    <TableHead>NISS novo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.numero_agente || "—"}</TableCell>
                      <TableCell className="text-xs">{r.nome_actual ?? r.nome_ficheiro ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.niss_actual ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.niss || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {badge(r.status)}
                          {r.motivo && <span className="text-[10px] text-muted-foreground">{r.motivo}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button
                onClick={handleImport}
                disabled={summary.novos + summary.atualizar === 0}
              >
                Aplicar {summary.novos + summary.atualizar} alterações
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>A atualizar NISS dos agentes...</p>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>{updated}</strong> NISS atualizados,{" "}
                <strong>{skipped}</strong> ignorados,{" "}
                <strong className={errors > 0 ? "text-destructive" : ""}>{errors}</strong> com erro.
              </AlertDescription>
            </Alert>
            {rows.some((r) => r.status === "nao_encontrado" || r.status === "invalido") && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Algumas linhas foram ignoradas. Reveja os agentes marcados como "Não encontrado" ou "Inválido".
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button onClick={() => { reset(); onOpenChange(false); }}>Concluir</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
