import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TransferStatus = "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "EXECUTED" | "REJECTED";

export interface TransferRequest {
  id: string;
  professor_id: string;
  from_school_id: string;
  to_school_id: string;
  reason: string | null;
  status: TransferStatus;
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  executed_by: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransferRequests() {
  return useQuery({
    queryKey: ["transfer_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TransferRequest[];
    },
  });
}

export function useCreateTransferRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      professor_id: string;
      from_school_id: string;
      to_school_id: string;
      reason?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("transfer_requests")
        .insert({ ...payload, requested_by: u.user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer_requests"] });
      toast.success("Pedido de transferência submetido");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao submeter pedido"),
  });
}

export function useUpdateTransferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      review_comment,
    }: { id: string; status: TransferStatus; review_comment?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("transfer_requests")
        .update({
          status,
          review_comment,
          reviewed_by: u.user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer_requests"] });
      toast.success("Estado actualizado");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao actualizar"),
  });
}

export function useExecuteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("execute_transfer", { _request_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfer_requests"] });
      qc.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Transferência executada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao executar transferência"),
  });
}
