import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentDocType = "BI" | "CERTIFICADO" | "DIPLOMA" | "CONTRATO" | "DECLARACAO" | "OUTRO";

export interface AgentDocument {
  id: string;
  professor_id: string;
  doc_type: AgentDocType;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

const BUCKET = "agent-documents";

export function useAgentDocuments(professorId: string) {
  return useQuery({
    queryKey: ["agent_documents", professorId],
    enabled: !!professorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_documents" as any)
        .select("*")
        .eq("professor_id", professorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AgentDocument[];
    },
  });
}

export function useUploadAgentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { professor_id: string; doc_type: AgentDocType; file: File }) => {
      const { professor_id, doc_type, file } = input;
      if (file.size > 10 * 1024 * 1024) throw new Error("Ficheiro acima de 10 MB");
      const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowed.includes(file.type)) throw new Error("Tipo de ficheiro não permitido (PDF, JPG, PNG)");

      const ext = file.name.split(".").pop() || "bin";
      const path = `${professor_id}/${doc_type}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("agent_documents" as any).insert({
        professor_id,
        doc_type,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user?.id,
      } as any);
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["agent_documents", vars.professor_id] });
      toast.success("Documento carregado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAgentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: AgentDocument) => {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from("agent_documents" as any).delete().eq("id", doc.id);
      if (error) throw error;
      return doc;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["agent_documents", doc.professor_id] });
      toast.success("Documento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function getAgentDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600);
  if (error) return null;
  return data.signedUrl;
}
