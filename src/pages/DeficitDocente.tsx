import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Users2, Save } from "lucide-react";
import { useDeficitByMunicipality, useTeacherRequirements, useUpsertTeacherRequirement, type Severity } from "@/hooks/useDeficit";
import { useEscolas } from "@/hooks/useEscolas";
import { useAuth } from "@/hooks/useAuth";

const severityStyle: Record<Severity, { label: string; cls: string }> = {
  SURPLUS: { label: "Excedente", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  LOW: { label: "Défice baixo", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  MODERATE: { label: "Moderado", cls: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  CRITICAL: { label: "Crítico", cls: "bg-destructive/15 text-destructive" },
  EMERGENCY: { label: "Emergência", cls: "bg-destructive text-destructive-foreground" },
  UNDEFINED: { label: "Não definido", cls: "bg-muted text-muted-foreground" },
};

const DeficitDocente = () => {
  const { isManager } = useAuth();
  const { data: deficit, isLoading } = useDeficitByMunicipality();
  const { data: requirements } = useTeacherRequirements();
  const { data: escolas } = useEscolas();
  const upsert = useUpsertTeacherRequirement();

  const [edit, setEdit] = useState<Record<string, number>>({});

  const reqBySchool = new Map(requirements?.map((r) => [r.school_id, r.required_teachers]));

  const critical = deficit?.filter((d) => d.severity === "CRITICAL" || d.severity === "EMERGENCY") || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Défice Docente"
          description="Análise de necessidades vs. quadro actual por município"
          icon={<Users2 className="h-6 w-6" />}
          isLoading={isLoading}
        />

        {critical.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{critical.length} município(s) em situação crítica</AlertTitle>
            <AlertDescription>
              {critical.map((c) => c.municipality_name).join(", ")} requerem reforço urgente.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="ranking">
          <TabsList>
            <TabsTrigger value="ranking">Ranking por município</TabsTrigger>
            {isManager && <TabsTrigger value="requirements">Definir necessidades</TabsTrigger>}
          </TabsList>

          <TabsContent value="ranking" className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : !deficit?.length ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">Sem dados de défice.</CardContent></Card>
            ) : (
              deficit.map((d) => {
                const st = severityStyle[d.severity];
                return (
                  <Card key={d.municipality_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="font-semibold">{d.municipality_name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Actual: {d.current_teachers} · Necessário: {d.required_teachers}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold">{d.deficit > 0 ? `−${d.deficit}` : `+${Math.abs(d.deficit)}`}</p>
                            <p className="text-xs text-muted-foreground">Diferença</p>
                          </div>
                          <Badge className={st.cls} variant="secondary">{st.label}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {isManager && (
            <TabsContent value="requirements" className="space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-base">Necessidade docente por unidade orgânica</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {escolas?.map((e) => {
                      const current = edit[e.id] ?? reqBySchool.get(e.id) ?? 0;
                      return (
                        <div key={e.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{e.nome}</p>
                          </div>
                          <div className="w-32">
                            <Label className="sr-only">Necessário</Label>
                            <Input
                              type="number"
                              min={0}
                              value={current}
                              onChange={(ev) => setEdit({ ...edit, [e.id]: Number(ev.target.value) })}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => upsert.mutate({ school_id: e.id, required_teachers: current })}
                            disabled={upsert.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DeficitDocente;
