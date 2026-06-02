import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ScopeType = "PROVINCE" | "MUNICIPALITY" | "SCHOOL";
export type PeriodType = "DAILY" | "MONTHLY" | "YEARLY";

export interface Snapshot {
  id: string;
  scope_type: ScopeType;
  scope_id: string;
  scope_name: string | null;
  period_type: PeriodType;
  period_key: string;
  total_teachers: number;
  teachers_male: number;
  teachers_female: number;
  teachers_by_category: Record<string, number>;
  total_schools: number;
  total_students: number;
  total_classes: number;
  payload: any;
  generated_by: string;
  generated_at: string;
  locked: boolean;
}

export function useSnapshots() {
  return useQuery({
    queryKey: ["statistics_snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("statistics_snapshots")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as Snapshot[];
    },
  });
}

export function useGenerateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      scope_type: ScopeType;
      scope_id: string;
      period_type: PeriodType;
      period_key: string;
    }) => {
      const { data, error } = await supabase.rpc("generate_snapshot", {
        _scope_type: args.scope_type,
        _scope_id: args.scope_id,
        _period_type: args.period_type,
        _period_key: args.period_key,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["statistics_snapshots"] });
      toast.success("Snapshot gerado com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao gerar snapshot"),
  });
}
