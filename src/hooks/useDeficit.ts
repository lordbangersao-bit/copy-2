import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Severity = "SURPLUS" | "LOW" | "MODERATE" | "CRITICAL" | "EMERGENCY" | "UNDEFINED";

export interface DeficitRow {
  municipality_id: string;
  municipality_name: string;
  province_id: string;
  required_teachers: number;
  current_teachers: number;
  deficit: number;
  severity: Severity;
}

export function useDeficitByMunicipality() {
  return useQuery({
    queryKey: ["deficit_by_municipality"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deficit_by_municipality")
        .select("*")
        .order("deficit", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeficitRow[];
    },
  });
}

export interface TeacherRequirement {
  id: string;
  school_id: string;
  required_teachers: number;
  notes: string | null;
}

export function useTeacherRequirements() {
  return useQuery({
    queryKey: ["teacher_requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_requirements")
        .select("*");
      if (error) throw error;
      return (data || []) as TeacherRequirement[];
    },
  });
}

export function useUpsertTeacherRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { school_id: string; required_teachers: number; notes?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("teacher_requirements")
        .upsert(
          { ...input, updated_by: u.user!.id, updated_at: new Date().toISOString() },
          { onConflict: "school_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher_requirements"] });
      qc.invalidateQueries({ queryKey: ["deficit_by_municipality"] });
      toast.success("Necessidade actualizada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao actualizar"),
  });
}
