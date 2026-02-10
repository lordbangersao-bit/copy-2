import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TipoExpediente = "MAPA_FALTAS" | "MAPA_SUBSIDIO_FERIAS" | "MAPA_ESTATISTICO" | "OUTRO";
export type EstadoExpediente = "SUBMETIDO" | "EM_ANALISE" | "APROVADO" | "REJEITADO";

export interface Expediente {
  id: string;
  escola_id: string;
  tipo: TipoExpediente;
  titulo: string;
  descricao: string | null;
  estado: EstadoExpediente;
  dados: Record<string, any>;
  periodo_referencia: string | null;
  observacoes_revisao: string | null;
  submetido_por: string | null;
  analisado_por: string | null;
  data_submissao: string;
  data_analise: string | null;
  created_at: string;
  updated_at: string;
  escola_nome?: string;
}

export interface ExpedienteInput {
  escola_id: string;
  tipo: TipoExpediente;
  titulo: string;
  descricao?: string;
  dados?: Record<string, any>;
  periodo_referencia?: string;
  submetido_por?: string;
}

const TIPO_LABELS: Record<TipoExpediente, string> = {
  MAPA_FALTAS: "Mapa de Faltas",
  MAPA_SUBSIDIO_FERIAS: "Mapa de Subsídio de Férias",
  MAPA_ESTATISTICO: "Mapa Estatístico",
  OUTRO: "Outro Expediente",
};

const ESTADO_LABELS: Record<EstadoExpediente, string> = {
  SUBMETIDO: "Submetido",
  EM_ANALISE: "Em Análise",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

export const getTipoLabel = (tipo: TipoExpediente) => TIPO_LABELS[tipo] || tipo;
export const getEstadoLabel = (estado: EstadoExpediente) => ESTADO_LABELS[estado] || estado;

export function useExpedientes() {
  return useQuery({
    queryKey: ["expedientes"],
    queryFn: async () => {
      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select("*")
        .order("data_submissao", { ascending: false });

      if (error) throw error;

      // Fetch escola names
      const escolaIds = [...new Set((expedientes || []).map((e: any) => e.escola_id))];
      let escolaMap: Record<string, string> = {};

      if (escolaIds.length > 0) {
        const { data: escolas } = await supabase
          .from("escolas")
          .select("id, nome")
          .in("id", escolaIds);
        
        if (escolas) {
          escolaMap = Object.fromEntries(escolas.map((e) => [e.id, e.nome]));
        }
      }

      return (expedientes || []).map((exp: any) => ({
        ...exp,
        escola_nome: escolaMap[exp.escola_id] || "Escola desconhecida",
      })) as Expediente[];
    },
  });
}

export function useCreateExpediente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpedienteInput) => {
      const { data, error } = await supabase
        .from("expedientes")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Expediente submetido com sucesso");
    },
    onError: (error: any) => {
      toast.error("Erro ao submeter expediente: " + error.message);
    },
  });
}

export function useUpdateExpedienteEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado, observacoes_revisao, analisado_por }: {
      id: string;
      estado: EstadoExpediente;
      observacoes_revisao?: string;
      analisado_por?: string;
    }) => {
      const { data, error } = await supabase
        .from("expedientes")
        .update({
          estado,
          observacoes_revisao,
          analisado_por,
          data_analise: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Estado do expediente atualizado");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar expediente: " + error.message);
    },
  });
}

export function useDeleteExpediente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expedientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Expediente excluído com sucesso");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir expediente: " + error.message);
    },
  });
}
