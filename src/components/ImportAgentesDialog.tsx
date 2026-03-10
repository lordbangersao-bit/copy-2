import { useState, useRef } from "react";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertTriangle, CheckCircle, FileSpreadsheet, Loader2 } from "lucide-react";

interface ParsedAgent {
  numero_agente: string;
  numero_cadastro: string;
  unidade_organica: string;
  nome: string;
  regime: string;
  grupo: string;
  categoria: string;
  escalao: string;
  vinculo_funcional: string;
  tipo_documento: string;
  num_documento: string;
  data_inicio_vinculo: string;
  estado_vinculo: string;
}

interface Inconsistency {
  tipo: "erro" | "aviso" | "info";
  mensagem: string;
  agente?: string;
}

interface ImportResult {
  total: number;
  inseridos: number;
  atualizados: number;
  ignorados: number;
  erros: number;
  inconsistencias: Inconsistency[];
}

interface ImportAgentesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportAgentesDialog({ open, onOpenChange }: ImportAgentesDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">("upload");
  const [parsedData, setParsedData] = useState<ParsedAgent[]>([]);
  const [inconsistencias, setInconsistencias] = useState<Inconsistency[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  const resetState = () => {
    setStep("upload");
    setParsedData([]);
    setInconsistencias([]);
    setProgress(0);
    setResult(null);
    setFileName("");
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr === "NaT") return null;
    // Try DD/MM/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    // Try ISO
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  };

  const cleanSchoolName = (name: string): string => {
    return name
      .replace(/^\[Eqt\]\s*/i, "")
      .replace(/\s*-\s*Namacunde\s*$/i, "")
      .trim();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // Find header row
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          if (rows[i].some(c => String(c).includes("AGENTE") || String(c).includes("NOME"))) {
            headerIdx = i;
            break;
          }
        }
        if (headerIdx === -1) {
          toast.error("Formato de ficheiro não reconhecido");
          return;
        }

        const agents: ParsedAgent[] = [];
        const issues: Inconsistency[] = [];

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i].map(c => String(c).trim());
          const numAgente = row[0] || "";
          const numINSS = row[1] || "";
          const unidadeOrg = row[2] || "";
          const nomeBase = row[3] || "";
          const nomeNov = row[4] || "";
          const regime = row[5] || "";
          const grupo = row[6] || "";
          const categoria = row[7] || "";
          const escalao = row[8] || "";
          const vinculo = row[9] || "";
          const tipoDoc = row[10] || "";
          const numDoc = row[11] || "";
          const dataInicio = row[12] || "";
          const estadoVinculo = row[14] || "";

          const nome = nomeBase || nomeNov;

          // Skip empty/placeholder rows
          if (!nome || nome === "Agente") continue;
          if (!numAgente && !unidadeOrg) continue;

          // Check name mismatch
          if (nomeBase && nomeNov && nomeBase !== nomeNov) {
            issues.push({
              tipo: "aviso",
              mensagem: `Nome divergente: Base="${nomeBase}" vs Nov="${nomeNov}"`,
              agente: numAgente,
            });
          }

          // Check missing numero_agente
          if (!numAgente) {
            issues.push({
              tipo: "aviso",
              mensagem: `Agente "${nome}" sem Nº de Agente (referência da unidade orgânica)`,
              agente: nome,
            });
            continue; // Skip rows without agente number (these are references)
          }

          // Check missing dates
          if (!dataInicio || dataInicio === "NaT") {
            issues.push({
              tipo: "aviso",
              mensagem: `Agente "${nome}" (${numAgente}) sem data de início de vínculo`,
              agente: numAgente,
            });
          }

          agents.push({
            numero_agente: numAgente,
            numero_cadastro: numINSS,
            unidade_organica: unidadeOrg,
            nome: nome,
            regime,
            grupo,
            categoria,
            escalao,
            vinculo_funcional: vinculo,
            tipo_documento: tipoDoc,
            num_documento: numDoc,
            data_inicio_vinculo: dataInicio,
            estado_vinculo: estadoVinculo,
          });
        }

        // Deduplicate by numero_agente - prefer entries with unidade_organica
        const agentMap = new Map<string, ParsedAgent>();
        for (const agent of agents) {
          const existing = agentMap.get(agent.numero_agente);
          if (!existing) {
            agentMap.set(agent.numero_agente, agent);
          } else {
            // Prefer the one with more data (unidade_organica + regime)
            if (agent.unidade_organica && agent.regime && (!existing.unidade_organica || !existing.regime)) {
              agentMap.set(agent.numero_agente, agent);
            }
            if (existing.unidade_organica !== agent.unidade_organica && agent.unidade_organica && existing.unidade_organica) {
              issues.push({
                tipo: "info",
                mensagem: `Agente "${agent.nome}" (${agent.numero_agente}) aparece em múltiplas unidades orgânicas`,
                agente: agent.numero_agente,
              });
            }
          }
        }

        const uniqueAgents = Array.from(agentMap.values());

        // Check for duplicates
        const totalDuplicates = agents.length - uniqueAgents.length;
        if (totalDuplicates > 0) {
          issues.push({
            tipo: "info",
            mensagem: `${totalDuplicates} registos duplicados foram consolidados (mantido o registo com mais dados)`,
          });
        }

        setParsedData(uniqueAgents);
        setInconsistencias(issues);
        setStep("preview");
      } catch (err) {
        toast.error("Erro ao ler o ficheiro: " + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const normalizeCategoria = (cat: string): string | null => {
    if (!cat || cat === "CATEGORIA") return null;
    const c = cat.trim();
    
    // Map Excel variations to system standard
    const mapping: Record<string, string> = {
      "Professor Do Ens. Prim. E Sec. Do 13o Grau": "Prof. do Ens. Primário e Sec. do 13º Grau",
      "Professor Do Ens. Prim. E Sec. Do 12o Grau": "Prof. do Ens. Primário e Sec. do 12º Grau",
      "Professor Do Ens. Prim. E Sec. Do 11o Grau": "Prof. do Ens. Primário e Sec. do 11º Grau",
      "Professor Do Ens. Prim. E Sec. Do 10o Grau": "Prof. do Ens. Primário e Sec. do 10º Grau",
      "Professor Do Ens. Prim. E Sec. Do 9o Grau": "Prof. do Ens. Primário e Sec. do 9º Grau",
      "Professor Do Ens. Prim. E Sec. Do 8o Grau": "Prof. do Ens. Primário e Sec. do 8º Grau",
      "Professor Do Ens. Prim. E Sec. Do 7o Grau": "Prof. do Ens. Primário e Sec. do 7º Grau",
      "Professor Do Ens. Prim. E Sec. Do 6o Grau": "Prof. do Ens. Primário e Sec. do 6º Grau",
      "Professor Do Ens. Prim. E Sec. Do 5o Grau": "Prof. do Ens. Primário e Sec. do 5º Grau",
      "Professor Do Ens. Prim. E Sec. Do 4o Grau": "Prof. do Ens. Primário e Sec. do 4º Grau",
      "Professor Do Ens. Prim. E Sec. Do 3o Grau": "Prof. do Ens. Primário e Sec. do 3º Grau",
      "Professor Do Ens. Prim. E Sec. Do 2o Grau": "Prof. do Ens. Primário e Sec. do 2º Grau",
      "Professor Do Ens. Prim. E Sec. Do 1o Grau": "Prof. do Ens. Primário e Sec. do 1º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 13.O Grau": "Prof. do Ens. Primário e Sec. do 13º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 12.O Grau": "Prof. do Ens. Primário e Sec. do 12º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 11.O Grau": "Prof. do Ens. Primário e Sec. do 11º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 10.O Grau": "Prof. do Ens. Primário e Sec. do 10º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 9.O Grau": "Prof. do Ens. Primário e Sec. do 9º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 8.O Grau": "Prof. do Ens. Primário e Sec. do 8º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 7.O Grau": "Prof. do Ens. Primário e Sec. do 7º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 6.O Grau": "Prof. do Ens. Primário e Sec. do 6º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 5.O Grau": "Prof. do Ens. Primário e Sec. do 5º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 4.O Grau": "Prof. do Ens. Primário e Sec. do 4º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 3.O Grau": "Prof. do Ens. Primário e Sec. do 3º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 2.O Grau": "Prof. do Ens. Primário e Sec. do 2º Grau",
      "Prof. Do Ens. Prim. E Sec. Do 1.O Grau": "Prof. do Ens. Primário e Sec. do 1º Grau",
      "Professor Auxiliar Do 1o Grau": "Prof. Auxiliar do 1º grau",
      "Professor Auxiliar Do 2o Grau": "Prof. Auxiliar do 2º grau",
      "Professor Auxiliar Do 3o Grau": "Prof. Auxiliar do 3º grau",
      "Professor Auxiliar Do 4o Grau": "Prof. Auxiliar do 4º grau",
      "Professor Auxiliar Do 5o Grau": "Prof. Auxiliar do 5º grau",
      "Auxiliar De Limpeza De Segunda": "Auxiliar de Limpeza",
      "Auxiliar De Limpeza De Primeira": "Auxiliar de Limpeza",
      "Operario Qualificado De Segunda": "Operário Qualificado",
      "Operario Qualificado De Primeira": "Operário Qualificado",
    };

    if (mapping[c]) return mapping[c];

    // Try case-insensitive match
    const lowerC = c.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (key.toLowerCase() === lowerC) return value;
    }

    return c;
  };

  const mapFuncao = (grupo: string, categoria: string): string | null => {
    if (!grupo && !categoria) return null;
    if (categoria) return normalizeCategoria(categoria);
    return grupo || null;
  };

  const mapRegimeContrato = (regime: string, vinculo: string): string | null => {
    if (vinculo) return vinculo;
    if (regime) return regime;
    return null;
  };

  const handleImport = async () => {
    setStep("importing");
    const issues: Inconsistency[] = [...inconsistencias];
    let inseridos = 0;
    let atualizados = 0;
    let ignorados = 0;
    let erros = 0;

    try {
      // 1. Get/create escolas
      const schoolNames = [...new Set(parsedData.map(a => a.unidade_organica).filter(Boolean))];
      const schoolMap = new Map<string, string>();

      if (schoolNames.length > 0) {
        // Get existing escolas
        const { data: existingEscolas } = await supabase.from("escolas").select("id, nome");
        const existingMap = new Map((existingEscolas || []).map(e => [e.nome.toLowerCase(), e.id]));

        for (const rawName of schoolNames) {
          const cleanName = cleanSchoolName(rawName);
          const existing = existingMap.get(cleanName.toLowerCase());
          if (existing) {
            schoolMap.set(rawName, existing);
          } else {
            // Create escola
            const { data: newEscola, error } = await supabase
              .from("escolas")
              .insert({ nome: cleanName })
              .select("id")
              .single();
            if (error) {
              issues.push({
                tipo: "erro",
                mensagem: `Erro ao criar escola "${cleanName}": ${error.message}`,
              });
            } else if (newEscola) {
              schoolMap.set(rawName, newEscola.id);
              existingMap.set(cleanName.toLowerCase(), newEscola.id);
            }
          }
        }
      }

      setProgress(10);

      // 2. Check existing agents
      const { data: existingAgents } = await supabase
        .from("professores")
        .select("id, numero_agente")
        .not("numero_agente", "is", null);
      
      const existingAgentMap = new Map(
        (existingAgents || []).filter(a => a.numero_agente).map(a => [a.numero_agente!, a.id])
      );

      setProgress(20);

      // 3. Batch insert/update agents
      const batchSize = 50;
      const totalBatches = Math.ceil(parsedData.length / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchData = parsedData.slice(batch * batchSize, (batch + 1) * batchSize);

        for (const agent of batchData) {
          const escolaId = agent.unidade_organica ? schoolMap.get(agent.unidade_organica) || null : null;
          const dataAdmissao = parseDate(agent.data_inicio_vinculo);

          const record = {
            nome: agent.nome,
            numero_agente: agent.numero_agente,
            numero_cadastro: agent.numero_cadastro || null,
            escola_id: escolaId,
            cpf: agent.num_documento || null,
            categoria: agent.categoria || null,
            funcao: mapFuncao(agent.grupo, agent.categoria),
            regime_contrato: mapRegimeContrato(agent.regime, agent.vinculo_funcional),
            data_admissao: dataAdmissao,
            status: agent.estado_vinculo?.toLowerCase() === "activo" ? "ativo" : "inativo",
            actividade: agent.estado_vinculo || "activo",
          };

          const existingId = existingAgentMap.get(agent.numero_agente);

          try {
            if (existingId) {
              // Update existing
              const { error } = await supabase
                .from("professores")
                .update(record)
                .eq("id", existingId);
              if (error) {
                erros++;
                issues.push({
                  tipo: "erro",
                  mensagem: `Erro ao atualizar "${agent.nome}": ${error.message}`,
                  agente: agent.numero_agente,
                });
              } else {
                atualizados++;
              }
            } else {
              // Insert new
              const { error } = await supabase
                .from("professores")
                .insert(record);
              if (error) {
                erros++;
                issues.push({
                  tipo: "erro",
                  mensagem: `Erro ao inserir "${agent.nome}": ${error.message}`,
                  agente: agent.numero_agente,
                });
              } else {
                inseridos++;
              }
            }
          } catch (err) {
            erros++;
            issues.push({
              tipo: "erro",
              mensagem: `Erro inesperado com "${agent.nome}": ${(err as Error).message}`,
              agente: agent.numero_agente,
            });
          }
        }

        setProgress(20 + Math.round(((batch + 1) / totalBatches) * 80));
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      queryClient.invalidateQueries({ queryKey: ["escolas"] });

      const finalResult: ImportResult = {
        total: parsedData.length,
        inseridos,
        atualizados,
        ignorados,
        erros,
        inconsistencias: issues,
      };

      setResult(finalResult);
      setStep("result");
      toast.success(`Importação concluída: ${inseridos} inseridos, ${atualizados} atualizados`);
    } catch (err) {
      toast.error("Erro durante a importação: " + (err as Error).message);
      setStep("preview");
    }
  };

  const errosCount = inconsistencias.filter(i => i.tipo === "erro").length;
  const avisosCount = inconsistencias.filter(i => i.tipo === "aviso").length;
  const infosCount = inconsistencias.filter(i => i.tipo === "info").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Agentes via Excel
          </DialogTitle>
          <DialogDescription>
            Carregue um ficheiro Excel com dados dos agentes para importação em massa.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Clique ou arraste para carregar</p>
              <p className="text-xs text-muted-foreground mt-1">Ficheiros .xlsx ou .xls</p>
              {fileName && (
                <Badge variant="secondary" className="mt-2">{fileName}</Badge>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{parsedData.length}</p>
                <p className="text-xs text-muted-foreground">Agentes encontrados</p>
              </div>
              <div className="bg-warning/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-warning">{avisosCount}</p>
                <p className="text-xs text-muted-foreground">Avisos</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{errosCount}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {/* Schools to be created */}
            {(() => {
              const schools = [...new Set(parsedData.map(a => a.unidade_organica).filter(Boolean))];
              return schools.length > 0 ? (
                <Alert>
                  <AlertDescription>
                    <strong>{schools.length} escolas/unidades orgânicas</strong> serão criadas ou actualizadas automaticamente.
                  </AlertDescription>
                </Alert>
              ) : null;
            })()}

            {inconsistencias.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Inconsistências detectadas ({inconsistencias.length})
                </p>
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="space-y-1">
                    {inconsistencias.map((inc, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded ${
                          inc.tipo === "erro"
                            ? "bg-destructive/10 text-destructive"
                            : inc.tipo === "aviso"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium">
                          {inc.tipo === "erro" ? "❌" : inc.tipo === "aviso" ? "⚠️" : "ℹ️"}
                        </span>{" "}
                        {inc.mensagem}
                        {inc.agente && (
                          <span className="ml-1 opacity-70">[{inc.agente}]</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetState}>
                Cancelar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {parsedData.length} Agentes
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">A importar agentes...</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% concluído</p>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
              <p className="text-lg font-bold">Importação Concluída</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success">{result.inseridos}</p>
                <p className="text-xs text-muted-foreground">Novos inseridos</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{result.atualizados}</p>
                <p className="text-xs text-muted-foreground">Actualizados</p>
              </div>
              <div className="bg-warning/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-warning">
                  {result.inconsistencias.filter(i => i.tipo === "aviso").length}
                </p>
                <p className="text-xs text-muted-foreground">Avisos</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{result.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {result.inconsistencias.filter(i => i.tipo === "erro").length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-destructive">
                  Erros durante a importação:
                </p>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {result.inconsistencias
                      .filter(i => i.tipo === "erro")
                      .map((inc, idx) => (
                        <div key={idx} className="text-xs p-1 bg-destructive/10 rounded text-destructive">
                          ❌ {inc.mensagem}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {result.inconsistencias.filter(i => i.tipo === "aviso").length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-warning">
                  Avisos para correção manual:
                </p>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-1">
                    {result.inconsistencias
                      .filter(i => i.tipo === "aviso")
                      .map((inc, idx) => (
                        <div key={idx} className="text-xs p-1 bg-warning/10 rounded text-warning">
                          ⚠️ {inc.mensagem}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => { resetState(); onOpenChange(false); }}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
