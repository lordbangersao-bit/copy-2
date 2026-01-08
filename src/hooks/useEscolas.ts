import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Escola {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  diretor: string | null;
  created_at: string;
  updated_at: string;
}

export type EscolaInput = Omit<Escola, "id" | "created_at" | "updated_at">;

export function useEscolas() {
  return useQuery({
    queryKey: ["escolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escolas")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data as Escola[];
    },
  });
}

export function useCreateEscola() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (escola: EscolaInput) => {
      const { data, error } = await supabase
        .from("escolas")
        .insert(escola)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Escola cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar escola: " + error.message);
    },
  });
}

export function useUpdateEscola() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...escola }: Partial<Escola> & { id: string }) => {
      const { data, error } = await supabase
        .from("escolas")
        .update(escola)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast.success("Escola atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar escola: " + error.message);
    },
  });
}

export function useDeleteEscola() {
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
      toast.success("Escola excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir escola: " + error.message);
    },
  });
}
