import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldX, ExternalLink, Ban, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface IssuedDoc {
  id: string;
  document_code: string;
  document_number: string;
  document_type: string;
  title: string;
  municipality: string;
  issued_by_name: string | null;
  issued_at: string;
  revoked: boolean;
  revoked_at: string | null;
  revoke_reason: string | null;
}

export default function DocumentosEmitidos() {
  const { isAdmin, isManager } = useAuth();
  const [search, setSearch] = useState("");
  const [revokeDoc, setRevokeDoc] = useState<IssuedDoc | null>(null);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const canRevoke = isAdmin || isManager;

  const { data, isLoading } = useQuery({
    queryKey: ["issued_documents", search],
    queryFn: async () => {
      let q = supabase
        .from("issued_documents")
        .select("id, document_code, document_number, document_type, title, municipality, issued_by_name, issued_at, revoked, revoked_at, revoke_reason")
        .order("issued_at", { ascending: false })
        .limit(200);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`document_code.ilike.${s},document_number.ilike.${s},title.ilike.${s},issued_by_name.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as IssuedDoc[];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("issued_documents")
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_by: u.user!.id,
          revoke_reason: reason,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issued_documents"] });
      toast.success("Documento revogado");
      setRevokeDoc(null);
      setReason("");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao revogar"),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("issued_documents")
        .update({ revoked: false, revoked_at: null, revoke_reason: null, revoked_by: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issued_documents"] });
      toast.success("Documento restaurado");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao restaurar"),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Documentos Emitidos"
          description="Registo oficial de todos os documentos emitidos com verificação pública."
          icon={<FileText className="h-6 w-6" />}
        />

        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por código, nº, título ou emissor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !data || data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhum documento emitido ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Emissor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        {d.revoked ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldX className="h-3 w-3" /> Revogado
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                            <ShieldCheck className="h-3 w-3" /> Válido
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.document_code}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={d.title}>{d.title}</TableCell>
                      <TableCell><Badge variant="outline">{d.document_type}</Badge></TableCell>
                      <TableCell>{d.municipality}</TableCell>
                      <TableCell className="text-sm">{d.issued_by_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(d.issued_at).toLocaleString("pt-AO")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Verificar publicamente">
                          <Link to={`/verify/${d.document_code}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canRevoke && !d.revoked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title="Revogar"
                            onClick={() => setRevokeDoc(d)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {canRevoke && d.revoked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreMutation.mutate(d.id)}
                            disabled={restoreMutation.isPending}
                          >
                            Restaurar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!revokeDoc} onOpenChange={(o) => !o && setRevokeDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar Documento</DialogTitle>
            <DialogDescription>
              Esta acção marca o documento como <strong>INVÁLIDO</strong> na verificação pública.
              A revogação fica registada na auditoria.
            </DialogDescription>
          </DialogHeader>

          {revokeDoc && (
            <div className="space-y-3 text-sm">
              <div><strong>Código:</strong> <code>{revokeDoc.document_code}</code></div>
              <div><strong>Título:</strong> {revokeDoc.title}</div>
              <div className="space-y-1">
                <Label htmlFor="reason">Motivo da revogação *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Erro nos dados do beneficiário; documento substituído pela versão XXX..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDoc(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || revokeMutation.isPending}
              onClick={() => revokeDoc && revokeMutation.mutate({ id: revokeDoc.id, reason: reason.trim() })}
            >
              {revokeMutation.isPending ? "A revogar..." : "Confirmar Revogação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
