import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Infrastructure {
  id: string;
  school_id: string;
  type: string;
  quantity: number;
  condition: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useInfrastructure(schoolId?: string) {
  return useQuery({
    queryKey: ["infrastructure", schoolId],
    queryFn: async () => {
      let query = supabase.from("infrastructure").select("*").order("type");
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Infrastructure[];
    },
  });
}

export function useCreateInfrastructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Infrastructure, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("infrastructure").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["infrastructure"] }); toast.success("Infraestrutura registada"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateInfrastructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Infrastructure> & { id: string }) => {
      const { data, error } = await supabase.from("infrastructure").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["infrastructure"] }); toast.success("Infraestrutura actualizada"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteInfrastructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("infrastructure").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["infrastructure"] }); toast.success("Infraestrutura removida"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
