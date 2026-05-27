import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PendingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "APPLIED";
export type PendingOperation = "INSERT" | "UPDATE" | "DELETE";

export interface PendingChange {
  id: string;
  table_name: string;
  record_id: string | null;
  operation: PendingOperation;
  proposed_data: Record<string, any>;
  current_data: Record<string, any> | null;
  status: PendingStatus;
  province_id: string | null;
  municipality_id: string | null;
  school_id: string | null;
  submitted_by: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export function usePendingChanges(filters?: { status?: PendingStatus; table?: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("pending-changes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_changes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pending_changes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["pending_changes", filters],
    queryFn: async () => {
      let q = supabase.from("pending_changes" as any).select("*").order("submitted_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.table) q = q.eq("table_name", filters.table);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PendingChange[];
    },
  });
}

export function useSubmitPendingChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      table_name: string;
      operation: PendingOperation;
      record_id?: string | null;
      proposed_data: Record<string, any>;
      current_data?: Record<string, any> | null;
      province_id?: string | null;
      municipality_id?: string | null;
      school_id?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const { data, error } = await supabase.from("pending_changes" as any).insert({
        ...input,
        status: "SUBMITTED",
        submitted_by: user.id,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_changes"] });
      toast.success("Proposta submetida para validação");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useReviewPendingChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; decision: "APPROVED" | "REJECTED"; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("pending_changes" as any).update({
        status: input.decision,
        review_comment: input.comment ?? null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      } as any).eq("id", input.id);
      if (error) throw error;
      // If approved, immediately apply
      if (input.decision === "APPROVED") {
        const { error: rpcError } = await supabase.rpc("apply_pending_change" as any, { _pending_id: input.id });
        if (rpcError) throw rpcError;
      }
      return input;
    },
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ["pending_changes"] });
      qc.invalidateQueries({ queryKey: ["professores"] });
      qc.invalidateQueries({ queryKey: ["escolas"] });
      qc.invalidateQueries({ queryKey: ["infrastructure"] });
      toast.success(v.decision === "APPROVED" ? "Proposta aprovada e aplicada" : "Proposta rejeitada");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
