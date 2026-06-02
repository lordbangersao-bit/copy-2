import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCompare, ArrowRight, Check, X, Play, Plus } from "lucide-react";
import {
  useTransferRequests, useCreateTransferRequest, useUpdateTransferStatus, useExecuteTransfer,
  type TransferStatus,
} from "@/hooks/useTransferRequests";
import { useProfessores } from "@/hooks/useProfessores";
import { useEscolas } from "@/hooks/useEscolas";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<TransferStatus, string> = {
  REQUESTED: "bg-muted text-muted-foreground",
  UNDER_REVIEW: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  EXECUTED: "bg-primary/15 text-primary",
  REJECTED: "bg-destructive/15 text-destructive",
};

const statusLabel: Record<TransferStatus, string> = {
  REQUESTED: "Solicitada",
  UNDER_REVIEW: "Em análise",
  APPROVED: "Aprovada",
  EXECUTED: "Executada",
  REJECTED: "Rejeitada",
};

const Transferencias = () => {
  const { role, canValidate, isAdmin } = useAuth();
  const { data: transfers, isLoading } = useTransferRequests();
  const { data: professores } = useProfessores();
  const { data: escolas } = useEscolas();
  const create = useCreateTransferRequest();
  const update = useUpdateTransferStatus();
  const exec = useExecuteTransfer();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ professor_id: "", to_school_id: "", reason: "" });

  const canCreate = role === "DIRECTOR_ESCOLA" || role === "GESTOR_MUNICIPAL" || isAdmin;
  const canDecide = canValidate || role === "GESTOR_MUNICIPAL";

  const escolaName = (id?: string | null) => escolas?.find((e) => e.id === id)?.nome || "—";
  const profName = (id?: string | null) => professores?.find((p) => p.id === id)?.nome || "—";

  const handleSubmit = () => {
    const prof = professores?.find((p) => p.id === form.professor_id);
    if (!prof?.escola_id || !form.to_school_id) return;
    create.mutate(
      {
        professor_id: form.professor_id,
        from_school_id: prof.escola_id,
        to_school_id: form.to_school_id,
        reason: form.reason || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ professor_id: "", to_school_id: "", reason: "" });
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            title="Transferências de Agentes"
            description="Pedidos controlados de mobilidade entre unidades orgânicas"
            icon={<GitCompare className="h-6 w-6" />}
            isLoading={isLoading}
          />
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />Novo pedido
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo pedido de transferência</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Agente</Label>
                    <Select value={form.professor_id} onValueChange={(v) => setForm({ ...form, professor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
                      <SelectContent>
                        {professores?.filter((p) => p.escola_id).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} — {escolaName(p.escola_id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade de destino</Label>
                    <Select value={form.to_school_id} onValueChange={(v) => setForm({ ...form, to_school_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                      <SelectContent>
                        {escolas?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo</Label>
                    <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={!form.professor_id || !form.to_school_id || create.isPending}>
                    Submeter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : !transfers?.length ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Nenhum pedido de transferência.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {transfers.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="text-base">{profName(t.professor_id)}</CardTitle>
                    <Badge className={statusColors[t.status]} variant="secondary">{statusLabel[t.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{escolaName(t.from_school_id)}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="font-medium">{escolaName(t.to_school_id)}</span>
                  </div>
                  {t.reason && <p className="text-sm text-muted-foreground italic">"{t.reason}"</p>}
                  {t.review_comment && (
                    <p className="text-sm border-l-2 border-primary pl-3">Revisão: {t.review_comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Solicitado em {new Date(t.requested_at).toLocaleString("pt-PT")}
                    {t.executed_at && ` · Executado em ${new Date(t.executed_at).toLocaleString("pt-PT")}`}
                  </p>

                  {canDecide && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {t.status === "REQUESTED" && (
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: t.id, status: "UNDER_REVIEW" })}>
                          Iniciar análise
                        </Button>
                      )}
                      {(t.status === "REQUESTED" || t.status === "UNDER_REVIEW") && (
                        <>
                          <Button size="sm" onClick={() => update.mutate({ id: t.id, status: "APPROVED" })}>
                            <Check className="h-4 w-4 mr-1" />Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            const c = prompt("Motivo da rejeição:");
                            if (c) update.mutate({ id: t.id, status: "REJECTED", review_comment: c });
                          }}>
                            <X className="h-4 w-4 mr-1" />Rejeitar
                          </Button>
                        </>
                      )}
                      {t.status === "APPROVED" && (
                        <Button size="sm" onClick={() => exec.mutate(t.id)} disabled={exec.isPending}>
                          <Play className="h-4 w-4 mr-1" />Executar transferência
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Transferencias;
