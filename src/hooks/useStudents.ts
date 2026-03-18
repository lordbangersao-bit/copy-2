import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Student {
  id: string;
  name: string;
  school_id: string;
  class: string;
  birthdate: string | null;
  gender: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  enrollment_number: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentInput = Omit<Student, "id" | "created_at" | "updated_at">;

export function useStudents(schoolId?: string) {
  return useQuery({
    queryKey: ["students", schoolId],
    queryFn: async () => {
      let query = supabase.from("students").select("*").order("name");
      if (schoolId) query = query.eq("school_id", schoolId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const { data, error } = await supabase.from("students").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Aluno registado"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: StudentInput & { id: string }) => {
      const { data, error } = await supabase.from("students").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Aluno actualizado"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Aluno removido"); },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
