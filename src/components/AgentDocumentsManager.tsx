import { useState, useRef } from "react";
import { useAgentDocuments, useUploadAgentDocument, useDeleteAgentDocument, getAgentDocumentSignedUrl, AgentDocType } from "@/hooks/useAgentDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FileText, Upload, Download, Trash2, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";

const TYPES: { value: AgentDocType; label: string }[] = [
  { value: "BI", label: "Bilhete de Identidade" },
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "DECLARACAO", label: "Declaração" },
  { value: "OUTRO", label: "Outro" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function AgentDocumentsManager({ professorId }: { professorId: string }) {
  const { data: docs = [], isLoading } = useAgentDocuments(professorId);
  const upload = useUploadAgentDocument();
  const del = useDeleteAgentDocument();
  const [docType, setDocType] = useState<AgentDocType>("BI");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    upload.mutate({ professor_id: professorId, doc_type: docType, file: f });
    e.target.value = "";
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getAgentDocumentSignedUrl(filePath);
    if (!url) { toast.error("Não foi possível gerar o link"); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Documentos do agente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Tipo de documento</label>
            <Select value={docType} onValueChange={(v) => setDocType(v as AgentDocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Carregar (PDF/JPG/PNG, máx 10 MB)
          </Button>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem documentos carregados.</p>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.file_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{TYPES.find(t => t.value === d.doc_type)?.label || d.doc_type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatBytes(d.file_size)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDownload(d.file_path, d.file_name)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remover documento?"
        description={`Esta acção remove permanentemente "${deleteTarget?.file_name}".`}
        onConfirm={() => { if (deleteTarget) del.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) }); }}
        variant="destructive"
      />
    </Card>
  );
}
