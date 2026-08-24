import { platform } from "@/lib/platform";
import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart, Lock, Download } from "lucide-react";
import { useSnapshots, useGenerateSnapshot, type ScopeType, type PeriodType } from "@/hooks/useStatisticsSnapshots";
import { useProvinces } from "@/hooks/useProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import { useEscolas } from "@/hooks/useEscolas";
import { useAuth } from "@/hooks/useAuth";

const periodKeyDefault = (type: PeriodType) => {
  const d = new Date();
  if (type === "YEARLY") return String(d.getFullYear());
  if (type === "MONTHLY") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return d.toISOString().slice(0, 10);
};

const RelatoriosOficiais = () => {
  const { isManager } = useAuth();
  const { data: snapshots, isLoading } = useSnapshots();
  const generate = useGenerateSnapshot();
  const { data: provinces } = useProvinces();
  const { data: municipalities } = useMunicipalities();
  const { data: escolas } = useEscolas();

  const [scopeType, setScopeType] = useState<ScopeType>("MUNICIPALITY");
  const [scopeId, setScopeId] = useState<string>("");
  const [periodType, setPeriodType] = useState<PeriodType>("MONTHLY");
  const [periodKey, setPeriodKey] = useState<string>(periodKeyDefault("MONTHLY"));

  const scopeOptions = useMemo(() => {
    if (scopeType === "PROVINCE") return provinces?.map((p) => ({ id: p.id, name: p.name })) || [];
    if (scopeType === "MUNICIPALITY") return municipalities?.map((m) => ({ id: m.id, name: m.name })) || [];
    return escolas?.map((e) => ({ id: e.id, name: e.nome })) || [];
  }, [scopeType, provinces, municipalities, escolas]);

  const handleGenerate = () => {
    if (!scopeId) return;
    generate.mutate({ scope_type: scopeType, scope_id: scopeId, period_type: periodType, period_key: periodKey });
  };

  const exportJson = (snap: any) => {
    void platform.saveFile({
      data: JSON.stringify(snap, null, 2),
      filename: `snapshot-${snap.scope_type}-${snap.period_key}.json`,
      mime: "application/json",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Relatórios Oficiais"
          description="Snapshots históricos e imutáveis para reporting institucional"
          icon={<FileBarChart className="h-6 w-6" />}
          isLoading={isLoading}
        />

        {isManager && (
          <Card>
            <CardHeader><CardTitle className="text-base">Gerar novo snapshot</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5 items-end">
                <div className="space-y-2">
                  <Label>Tipo de scope</Label>
                  <Select value={scopeType} onValueChange={(v: ScopeType) => { setScopeType(v); setScopeId(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROVINCE">Província</SelectItem>
                      <SelectItem value="MUNICIPALITY">Município</SelectItem>
                      <SelectItem value="SCHOOL">Unidade Orgânica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select value={scopeId} onValueChange={setScopeId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {scopeOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodType} onValueChange={(v: PeriodType) => { setPeriodType(v); setPeriodKey(periodKeyDefault(v)); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chave de período</Label>
                  <Input value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} />
                </div>
                <Button onClick={handleGenerate} disabled={!scopeId || generate.isPending}>
                  Gerar snapshot
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : !snapshots?.length ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Sem snapshots gerados.</CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {snapshots.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">{s.scope_name || s.scope_id}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.scope_type}</Badge>
                      <Badge variant="secondary">{s.period_type} · {s.period_key}</Badge>
                      {s.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-muted-foreground text-xs">Agentes</p><p className="text-lg font-bold">{s.total_teachers}</p></div>
                    <div><p className="text-muted-foreground text-xs">Masc/Fem</p><p className="text-lg font-bold">{s.teachers_male}/{s.teachers_female}</p></div>
                    <div><p className="text-muted-foreground text-xs">Escolas</p><p className="text-lg font-bold">{s.total_schools}</p></div>
                    <div><p className="text-muted-foreground text-xs">Alunos</p><p className="text-lg font-bold">{s.total_students}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Gerado em {new Date(s.generated_at).toLocaleString("pt-PT")}</span>
                    <Button variant="ghost" size="sm" onClick={() => exportJson(s)}>
                      <Download className="h-3.5 w-3.5 mr-1" />Exportar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default RelatoriosOficiais;
