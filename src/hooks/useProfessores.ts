import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Professor {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  disciplina: string | null;
  escola_id: string | null;
  data_admissao: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProfessorWithEscola extends Professor {
  escolas: {
    id: string;
    nome: string;
  } | null;
}

export type ProfessorInput = Omit<Professor, "id" | "created_at" | "updated_at">;

export function useProfessores(escolaId?: string) {
  return useQuery({
    queryKey: ["professores", escolaId],
    queryFn: async () => {
      let query = supabase
        .from("professores")
        .select(`
          *,
          escolas (
            id,
            nome
          )
        `)
        .order("nome");
      
      if (escolaId) {
        query = query.eq("escola_id", escolaId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProfessorWithEscola[];
    },
  });
}

export function useCreateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (professor: ProfessorInput) => {
      const { data, error } = await supabase
        .from("professores")
        .insert(professor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar professor: " + error.message);
    },
  });
}

export function useUpdateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...professor }: Partial<Professor> & { id: string }) => {
      const { data, error } = await supabase
        .from("professores")
        .update(professor)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar professor: " + error.message);
    },
  });
}

export function useDeleteProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("professores")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir professor: " + error.message);
    },
  });
}
