import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, ShieldAlert, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";

interface RowLike {
  numeroContribuinte: string;
  nome: string;
  vencimentoBase: number;
  additional: number;
  totalAbonos: number;
}

type Severity = "critica" | "alta" | "media";

interface Anomaly {
  numero: string;
  nome: string;
  tipo: string;
  severidade: Severity;
  detalhe: string;
  valor: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mad(nums: number[], med: number): number {
  if (nums.length === 0) return 0;
  const dev = nums.map((n) => Math.abs(n - med));
  return median(dev);
}

export function AnomalyPanel({ rows }: { rows: RowLike[] }) {
  const analysis = useMemo(() => {
    const anomalies: Anomaly[] = [];
    if (rows.length === 0) return { anomalies, med: 0, madVal: 0 };

    const bases = rows.map((r) => r.vencimentoBase).filter((v) => v > 0);
    const med = median(bases);
    const madVal = mad(bases, med) || med * 0.1;

    // Duplicates by numero
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.numeroContribuinte, (seen.get(r.numeroContribuinte) ?? 0) + 1);

    for (const r of rows) {
      // Robust z-score
      const z = madVal > 0 ? Math.abs(r.vencimentoBase - med) / (1.4826 * madVal) : 0;

      if (r.vencimentoBase === 0 && r.totalAbonos > 0) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome, tipo: "Base zero com abonos",
          severidade: "critica",
          detalhe: `Salário base 0,00 mas com total de ${fmt(r.totalAbonos)}`,
          valor: r.totalAbonos,
        });
      } else if (r.vencimentoBase === 0) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome, tipo: "Salário base nulo",
          severidade: "alta",
          detalhe: "Sem vencimento base registado",
          valor: 0,
        });
      }

      if (r.additional < 0 || r.vencimentoBase < 0 || r.totalAbonos < 0) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome, tipo: "Valor negativo",
          severidade: "critica",
          detalhe: "Valor negativo detectado na folha",
          valor: r.totalAbonos,
        });
      }

      if (r.totalAbonos > 0 && r.additional > r.vencimentoBase * 3) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome, tipo: "Adicionais desproporcionais",
          severidade: "alta",
          detalhe: `Adicionais (${fmt(r.additional)}) > 3× a base (${fmt(r.vencimentoBase)})`,
          valor: r.additional,
        });
      }

      if (z >= 3.5) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome,
          tipo: r.vencimentoBase > med ? "Salário muito acima da mediana" : "Salário muito abaixo da mediana",
          severidade: z >= 5 ? "critica" : "alta",
          detalhe: `Base ${fmt(r.vencimentoBase)} · mediana ${fmt(med)} · desvio ${z.toFixed(1)}σ`,
          valor: r.vencimentoBase,
        });
      } else if (z >= 2.5) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome,
          tipo: "Salário atípico",
          severidade: "media",
          detalhe: `Base ${fmt(r.vencimentoBase)} · desvio ${z.toFixed(1)}σ da mediana`,
          valor: r.vencimentoBase,
        });
      }

      if ((seen.get(r.numeroContribuinte) ?? 0) > 1) {
        anomalies.push({
          numero: r.numeroContribuinte, nome: r.nome, tipo: "Agente duplicado",
          severidade: "critica",
          detalhe: "Mesmo Nº de Agente aparece em várias linhas",
          valor: r.totalAbonos,
        });
      }
    }

    // Dedupe by numero+tipo
    const uniq = new Map<string, Anomaly>();
    for (const a of anomalies) uniq.set(`${a.numero}|${a.tipo}`, a);

    const order: Record<Severity, number> = { critica: 0, alta: 1, media: 2 };
    return {
      anomalies: Array.from(uniq.values()).sort((a, b) => order[a.severidade] - order[b.severidade]),
      med,
      madVal,
    };
  }, [rows]);

  const counts = useMemo(() => ({
    critica: analysis.anomalies.filter((a) => a.severidade === "critica").length,
    alta: analysis.anomalies.filter((a) => a.severidade === "alta").length,
    media: analysis.anomalies.filter((a) => a.severidade === "media").length,
  }), [analysis]);

  const badge = (s: Severity) => {
    if (s === "critica") return <Badge variant="destructive">Crítica</Badge>;
    if (s === "alta") return <Badge className="bg-amber-600 hover:bg-amber-700">Alta</Badge>;
    return <Badge variant="secondary">Média</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Deteção de Anomalias
          </CardTitle>
          <CardDescription>
            Análise estatística robusta (MAD) · Mediana base:{" "}
            <span className="font-mono">{fmt(analysis.med)}</span>
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive">{counts.critica} críticas</Badge>
          <Badge className="bg-amber-600 hover:bg-amber-700">{counts.alta} altas</Badge>
          <Badge variant="secondary">{counts.media} médias</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {analysis.anomalies.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Sem anomalias detectadas</AlertTitle>
            <AlertDescription>
              Todos os {rows.length} registos estão dentro dos padrões esperados.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {counts.critica > 0 && (
              <Alert variant="destructive" className="mb-3">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Atenção: {counts.critica} anomalia(s) crítica(s)</AlertTitle>
                <AlertDescription>
                  Recomenda-se validar estas linhas antes de gerar o ficheiro INSS.
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="h-[380px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Nº Agente</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.anomalies.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{badge(a.severidade)}</TableCell>
                      <TableCell className="font-mono text-xs">{a.numero}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{a.nome}</TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1">
                          {a.tipo.includes("acima") ? <TrendingUp className="h-3 w-3" /> :
                            a.tipo.includes("abaixo") ? <TrendingDown className="h-3 w-3" /> : null}
                          {a.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.detalhe}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(a.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
