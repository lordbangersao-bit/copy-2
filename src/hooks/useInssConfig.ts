import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InssConfig {
  id: string;
  employer_name: string;
  employer_niss: string;
  employer_nif: string;
  decimal_format: string;
  currency: string;
  default_tipo: string;
  auto_backup: boolean;
}

export function useInssConfig() {
  return useQuery({
    queryKey: ["inss_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inss_config" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as InssConfig | null;
    },
  });
}

export function useUpdateInssConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<InssConfig> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase
        .from("inss_config" as any)
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inss_config"] }),
  });
}

export interface InssGeneration {
  id: string;
  generated_at: string;
  reference_month: string;
  tipo: string;
  source_filename: string | null;
  employer_name: string | null;
  total_employees: number;
  employees_matched: number;
  employees_missing_niss: number;
  duplicates: number;
  ignored_rows: number;
  total_base: number;
  total_adicionais: number;
  total_bruto: number;
  export_format: string;
  checksum: string | null;
  version: string;
}

export function useInssGenerations() {
  return useQuery({
    queryKey: ["inss_generations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inss_generations" as any)
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as InssGeneration[];
    },
  });
}

export function useRecordGeneration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("inss_generations" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inss_generations"] }),
  });
}
