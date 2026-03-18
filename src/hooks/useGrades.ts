import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  grade: number;
  period: string;
  recorded_by: string;
  reason: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export function useGrades(studentId?: string) {
  return useQuery({
    queryKey: ["grades", studentId],
    queryFn: async () => {
      let query = supabase.from("grades").select("*").order("created_at", { ascending: false });
      if (studentId) query = query.eq("student_id", studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Grade[];
    },
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Grade, "id" | "created_at" | "updated_at" | "approved">) => {
      const { data, error } = await supabase.from("grades").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades"] }); toast.success("Nota registada"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, ...input }: Partial<Grade> & { id: string; reason: string }) => {
      if (!reason || reason.trim().length < 5) throw new Error("Justificativa obrigatória (mín. 5 caracteres)");
      const { data, error } = await supabase.from("grades").update({ ...input, reason }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades"] }); toast.success("Nota actualizada (com justificativa)"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
