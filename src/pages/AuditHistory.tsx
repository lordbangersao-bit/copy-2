import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { History, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TABLE_LABELS: Record<string, string> = {
  escolas: "Escolas", professores: "Agentes", students: "Alunos",
  attendance: "Presenças", grades: "Notas", infrastructure: "Infraestrutura",
  expedientes: "Expedientes", municipalities: "Municípios", provinces: "Províncias",
  user_roles: "Utilizadores",
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-700",
  UPDATE: "bg-amber-500/10 text-amber-700",
  DELETE: "bg-destructive/10 text-destructive",
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: "Criação", UPDATE: "Alteração", DELETE: "Eliminação",
};

function DiffView({ oldData, newData }: { oldData: Record<string, any> | null; newData: Record<string, any> | null }) {
  if (!oldData && !newData) return null;

  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);

  // Filter out internal/uninteresting keys
  const skipKeys = new Set(["id", "created_at", "updated_at"]);
  const changedKeys = Array.from(allKeys).filter(k => {
    if (skipKeys.has(k)) return false;
    if (!oldData) return true;
    if (!newData) return true;
    return JSON.stringify(oldData[k]) !== JSON.stringify(newData[k]);
  });

  if (changedKeys.length === 0) return <p className="text-xs text-muted-foreground">Sem alterações visíveis</p>;

  return (
    <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
      {changedKeys.map(key => (
        <div key={key} className="flex items-start gap-2 bg-muted/50 rounded px-2 py-1">
          <span className="font-medium text-foreground min-w-[100px]">{key}</span>
          {oldData && oldData[key] !== undefined && (
            <span className="text-destructive line-through">{String(oldData[key] ?? "null")}</span>
          )}
          {oldData && newData && <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />}
          {newData && newData[key] !== undefined && (
            <span className="text-emerald-600">{String(newData[key] ?? "null")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditHistory() {
  const { isAdmin, role } = useAuth();
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    table_name: tableFilter !== "all" ? tableFilter : undefined,
    limit: 200,
  });

  if (!isAdmin && role !== "GESTOR_PROVINCIAL") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores e gestores provinciais.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Histórico de Auditoria" description="Registo de todas as alterações no sistema"
          icon={<History className="h-6 w-6" />} />

        <div className="flex gap-4">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por tabela" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tabelas</SelectItem>
              {Object.entries(TABLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {logs && <Badge variant="outline">{logs.length} registos</Badge>}
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Data/Hora</TableHead>
                <TableHead>Acção</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead className="hidden md:table-cell">Utilizador</TableHead>
                <TableHead className="hidden lg:table-cell">Papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map(log => (
                  <>
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      <TableCell className="text-xs font-mono">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action_type]}>{ACTION_LABELS[log.action_type]}</Badge>
                      </TableCell>
                      <TableCell>{TABLE_LABELS[log.table_name] || log.table_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{log.user_id?.slice(0, 8) || "Sistema"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {log.user_role && <Badge variant="outline" className="text-xs">{log.user_role}</Badge>}
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow key={`${log.id}-diff`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            {log.reason && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Justificativa:</span>
                                <span className="text-foreground">{log.reason}</span>
                              </div>
                            )}
                            <p className="text-xs font-medium text-muted-foreground mb-1">Alterações:</p>
                            <DiffView oldData={log.old_data} newData={log.new_data} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum registo de auditoria encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
