import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UnidadeOrganica {
  id: string;
  nome: string;
  codigo_organico: string | null;
  decreto_criacao: string | null;
  residencia: string | null;
  distancia_sede: string | null;
  construcao: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  diretor: string | null;
  // Docentes
  prof_masculino: number | null;
  prof_feminino: number | null;
  total_docentes: number | null;
  // Alunos Geral
  alunos_masculino: number | null;
  alunos_feminino: number | null;
  total_alunos: number | null;
  total_turmas: number | null;
  // Iniciação
  turmas_iniciacao: number | null;
  alunos_masc_iniciacao: number | null;
  alunos_fem_iniciacao: number | null;
  total_alunos_iniciacao: number | null;
  // 1ª Classe
  turmas_1_classe: number | null;
  alunos_masc_1_classe: number | null;
  alunos_fem_1_classe: number | null;
  total_alunos_1_classe: number | null;
  // 2ª Classe
  turmas_2_classe: number | null;
  alunos_masc_2_classe: number | null;
  alunos_fem_2_classe: number | null;
  total_alunos_2_classe: number | null;
  // 3ª Classe
  turmas_3_classe: number | null;
  alunos_masc_3_classe: number | null;
  alunos_fem_3_classe: number | null;
  total_alunos_3_classe: number | null;
  // 4ª Classe
  turmas_4_classe: number | null;
  alunos_masc_4_classe: number | null;
  alunos_fem_4_classe: number | null;
  total_alunos_4_classe: number | null;
  // 5ª Classe
  turmas_5_classe: number | null;
  alunos_masc_5_classe: number | null;
  alunos_fem_5_classe: number | null;
  total_alunos_5_classe: number | null;
  // 6ª Classe
  turmas_6_classe: number | null;
  alunos_masc_6_classe: number | null;
  alunos_fem_6_classe: number | null;
  total_alunos_6_classe: number | null;
  // 7ª Classe
  turmas_7_classe: number | null;
  alunos_masc_7_classe: number | null;
  alunos_fem_7_classe: number | null;
  total_alunos_7_classe: number | null;
  // 8ª Classe
  turmas_8_classe: number | null;
  alunos_masc_8_classe: number | null;
  alunos_fem_8_classe: number | null;
  total_alunos_8_classe: number | null;
  // 9ª Classe
  turmas_9_classe: number | null;
  alunos_masc_9_classe: number | null;
  alunos_fem_9_classe: number | null;
  total_alunos_9_classe: number | null;
  // 10ª Classe
  turmas_10_classe: number | null;
  alunos_masc_10_classe: number | null;
  alunos_fem_10_classe: number | null;
  total_alunos_10_classe: number | null;
  // 11ª Classe
  turmas_11_classe: number | null;
  alunos_masc_11_classe: number | null;
  alunos_fem_11_classe: number | null;
  total_alunos_11_classe: number | null;
  // 12ª Classe
  turmas_12_classe: number | null;
  alunos_masc_12_classe: number | null;
  alunos_fem_12_classe: number | null;
  total_alunos_12_classe: number | null;
  // 13ª Classe
  turmas_13_classe: number | null;
  alunos_masc_13_classe: number | null;
  alunos_fem_13_classe: number | null;
  total_alunos_13_classe: number | null;
  
  created_at: string;
  updated_at: string;
}

export type UnidadeOrganicaInput = Omit<UnidadeOrganica, "id" | "created_at" | "updated_at">;

export function useUnidadesOrganicas() {
  return useQuery({
    queryKey: ["escolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escolas")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as UnidadeOrganica[];
    },
  });
}

export function useCreateUnidadeOrganica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unidade: UnidadeOrganicaInput) => {
      const { data, error } = await supabase
        .from("escolas")
        .insert(unidade)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Unidade orgânica cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar unidade orgânica: " + error.message);
    },
  });
}

export function useUpdateUnidadeOrganica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...unidade }: Partial<UnidadeOrganica> & { id: string }) => {
      const { data, error } = await supabase
        .from("escolas")
        .update(unidade)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Unidade orgânica atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar unidade orgânica: " + error.message);
    },
  });
}

export function useDeleteUnidadeOrganica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("escolas")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Unidade orgânica excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir unidade orgânica: " + error.message);
    },
  });
}
