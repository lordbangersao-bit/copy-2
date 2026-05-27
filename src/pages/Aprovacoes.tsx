import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePendingChanges, useReviewPendingChange, PendingChange, PendingStatus } from "@/hooks/usePendingChanges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2, XCircle, Clock, Loader2, GitCompare, Inbox } from "lucide-react";

const statusColor: Record<PendingStatus, string> = {
  DRAFT: "bg-gray-500/10 text-gray-700",
  SUBMITTED: "bg-amber-500/10 text-amber-700",
  APPROVED: "bg-blue-500/10 text-blue-700",
  REJECTED: "bg-rose-500/10 text-rose-700",
  APPLIED: "bg-green-500/10 text-green-700",
};

const operationLabel: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Alteração",
  DELETE: "Eliminação",
};

const tableLabel: Record<string, string> = {
  professores: "Agente",
  escolas: "Escola / Unidade Orgânica",
  infrastructure: "Infraestrutura",
};

function DiffView({ current, proposed }: { current: Record<string, any> | null; proposed: Record<string, any> }) {
  const keys = Array.from(new Set([...(current ? Object.keys(current) : []), ...Object.keys(proposed || {})])).filter(k => !["created_at", "updated_at", "id"].includes(k));
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[140px_1fr_1fr] text-xs font-medium bg-muted px-3 py-2">
        <span>Campo</span>
        <span>Valor actual</span>
        <span>Valor proposto</span>
      </div>
      <div className="divide-y max-h-[400px] overflow-y-auto">
        {keys.map(k => {
          const cur = current?.[k];
          const prop = proposed?.[k];
          const changed = JSON.stringify(cur) !== JSON.stringify(prop);
          return (
            <div key={k} className={`grid grid-cols-[140px_1fr_1fr] text-xs px-3 py-2 ${changed ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
              <span className="font-medium text-muted-foreground truncate">{k}</span>
              <span className="truncate">{cur === null || cur === undefined ? <em className="text-muted-foreground">—</em> : String(cur)}</span>
              <span className={`truncate ${changed ? "font-medium text-foreground" : ""}`}>{prop === null || prop === undefined ? <em className="text-muted-foreground">—</em> : String(prop)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Aprovacoes() {
  const { canValidate, isLoading } = useAuth();
  const [tab, setTab] = useState<PendingStatus>("SUBMITTED");
  const { data: items = [], isLoading: loading } = usePendingChanges({ status: tab });
  const review = useReviewPendingChange();
  const [selected, setSelected] = useState<PendingChange | null>(null);
  const [comment, setComment] = useState("");

  if (isLoading) return <AppLayout><div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div></AppLayout>;
  if (!canValidate) return <Navigate to="/" replace />;

  const handleDecision = (decision: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (decision === "REJECTED" && !comment.trim()) { return; }
    review.mutate(
      { id: selected.id, decision, comment: comment.trim() || undefined },
      { onSuccess: () => { setSelected(null); setComment(""); } }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GitCompare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fila de Aprovações</h1>
            <p className="text-sm text-muted-foreground">Validar propostas de alteração submetidas pelos gestores municipais e directores</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as PendingStatus)}>
          <TabsList>
            <TabsTrigger value="SUBMITTED"><Clock className="h-3.5 w-3.5 mr-1" />Pendentes</TabsTrigger>
            <TabsTrigger value="APPLIED"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aplicadas</TabsTrigger>
            <TabsTrigger value="REJECTED"><XCircle className="h-3.5 w-3.5 mr-1" />Rejeitadas</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Total: {items.length}</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : items.length === 0 ? (
                  <EmptyState icon={Inbox} title="Sem propostas" description="Nenhuma proposta neste estado." />
                ) : (
                  <div className="space-y-2">
                    {items.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelected(p); setComment(p.review_comment || ""); }}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{tableLabel[p.table_name] || p.table_name}</Badge>
                            <Badge variant="outline">{operationLabel[p.operation]}</Badge>
                            <Badge className={statusColor[p.status]}>{p.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(p.submitted_at).toLocaleString("pt-PT")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Submetido por <span className="font-mono">{p.submitted_by.slice(0, 8)}…</span>
                          {p.review_comment && <span className="ml-2 italic">— {p.review_comment}</span>}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setComment(""); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && <>
                <Badge variant="outline">{tableLabel[selected.table_name] || selected.table_name}</Badge>
                <Badge variant="outline">{operationLabel[selected.operation]}</Badge>
              </>}
              Detalhe da proposta
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <DiffView current={selected.current_data} proposed={selected.proposed_data} />

              {selected.status === "SUBMITTED" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comentário (obrigatório para rejeitar)</label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Justificação da decisão…" />
                </div>
              )}
            </div>
          )}

          {selected?.status === "SUBMITTED" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleDecision("REJECTED")} disabled={review.isPending || !comment.trim()}>
                <XCircle className="h-4 w-4 mr-2" />Rejeitar
              </Button>
              <Button onClick={() => handleDecision("APPROVED")} disabled={review.isPending}>
                {review.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Aprovar e Aplicar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
