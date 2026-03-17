import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Municipality {
  id: string;
  name: string;
  province_id: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export function useMunicipalities(provinceId?: string) {
  return useQuery({
    queryKey: ["municipalities", provinceId],
    queryFn: async () => {
      let query = supabase.from("municipalities").select("*").order("name");
      if (provinceId) query = query.eq("province_id", provinceId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Municipality[];
    },
  });
}

export function useCreateMunicipality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; province_id: string; code?: string }) => {
      const { data, error } = await supabase.from("municipalities").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["municipalities"] }); toast.success("Município criado"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
