import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Province {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
  updated_at: string;
}

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Province[];
    },
  });
}

export function useCreateProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; code?: string }) => {
      const { data, error } = await supabase.from("provinces").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["provinces"] }); toast.success("Província criada"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
