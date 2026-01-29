export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      escolas: {
        Row: {
          alunos_fem_1_classe: number | null
          alunos_fem_10_classe: number | null
          alunos_fem_11_classe: number | null
          alunos_fem_12_classe: number | null
          alunos_fem_13_classe: number | null
          alunos_fem_2_classe: number | null
          alunos_fem_3_classe: number | null
          alunos_fem_4_classe: number | null
          alunos_fem_5_classe: number | null
          alunos_fem_6_classe: number | null
          alunos_fem_7_classe: number | null
          alunos_fem_8_classe: number | null
          alunos_fem_9_classe: number | null
          alunos_fem_iniciacao: number | null
          alunos_feminino: number | null
          alunos_masc_1_classe: number | null
          alunos_masc_10_classe: number | null
          alunos_masc_11_classe: number | null
          alunos_masc_12_classe: number | null
          alunos_masc_13_classe: number | null
          alunos_masc_2_classe: number | null
          alunos_masc_3_classe: number | null
          alunos_masc_4_classe: number | null
          alunos_masc_5_classe: number | null
          alunos_masc_6_classe: number | null
          alunos_masc_7_classe: number | null
          alunos_masc_8_classe: number | null
          alunos_masc_9_classe: number | null
          alunos_masc_iniciacao: number | null
          alunos_masculino: number | null
          codigo_organico: string | null
          construcao: string | null
          created_at: string
          decreto_criacao: string | null
          diretor: string | null
          distancia_sede: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          prof_feminino: number | null
          prof_masculino: number | null
          residencia: string | null
          telefone: string | null
          total_alunos: number | null
          total_alunos_1_classe: number | null
          total_alunos_10_classe: number | null
          total_alunos_11_classe: number | null
          total_alunos_12_classe: number | null
          total_alunos_13_classe: number | null
          total_alunos_2_classe: number | null
          total_alunos_3_classe: number | null
          total_alunos_4_classe: number | null
          total_alunos_5_classe: number | null
          total_alunos_6_classe: number | null
          total_alunos_7_classe: number | null
          total_alunos_8_classe: number | null
          total_alunos_9_classe: number | null
          total_alunos_iniciacao: number | null
          total_docentes: number | null
          total_turmas: number | null
          turmas_1_classe: number | null
          turmas_10_classe: number | null
          turmas_11_classe: number | null
          turmas_12_classe: number | null
          turmas_13_classe: number | null
          turmas_2_classe: number | null
          turmas_3_classe: number | null
          turmas_4_classe: number | null
          turmas_5_classe: number | null
          turmas_6_classe: number | null
          turmas_7_classe: number | null
          turmas_8_classe: number | null
          turmas_9_classe: number | null
          turmas_iniciacao: number | null
          updated_at: string
        }
        Insert: {
          alunos_fem_1_classe?: number | null
          alunos_fem_10_classe?: number | null
          alunos_fem_11_classe?: number | null
          alunos_fem_12_classe?: number | null
          alunos_fem_13_classe?: number | null
          alunos_fem_2_classe?: number | null
          alunos_fem_3_classe?: number | null
          alunos_fem_4_classe?: number | null
          alunos_fem_5_classe?: number | null
          alunos_fem_6_classe?: number | null
          alunos_fem_7_classe?: number | null
          alunos_fem_8_classe?: number | null
          alunos_fem_9_classe?: number | null
          alunos_fem_iniciacao?: number | null
          alunos_feminino?: number | null
          alunos_masc_1_classe?: number | null
          alunos_masc_10_classe?: number | null
          alunos_masc_11_classe?: number | null
          alunos_masc_12_classe?: number | null
          alunos_masc_13_classe?: number | null
          alunos_masc_2_classe?: number | null
          alunos_masc_3_classe?: number | null
          alunos_masc_4_classe?: number | null
          alunos_masc_5_classe?: number | null
          alunos_masc_6_classe?: number | null
          alunos_masc_7_classe?: number | null
          alunos_masc_8_classe?: number | null
          alunos_masc_9_classe?: number | null
          alunos_masc_iniciacao?: number | null
          alunos_masculino?: number | null
          codigo_organico?: string | null
          construcao?: string | null
          created_at?: string
          decreto_criacao?: string | null
          diretor?: string | null
          distancia_sede?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          prof_feminino?: number | null
          prof_masculino?: number | null
          residencia?: string | null
          telefone?: string | null
          total_alunos?: number | null
          total_alunos_1_classe?: number | null
          total_alunos_10_classe?: number | null
          total_alunos_11_classe?: number | null
          total_alunos_12_classe?: number | null
          total_alunos_13_classe?: number | null
          total_alunos_2_classe?: number | null
          total_alunos_3_classe?: number | null
          total_alunos_4_classe?: number | null
          total_alunos_5_classe?: number | null
          total_alunos_6_classe?: number | null
          total_alunos_7_classe?: number | null
          total_alunos_8_classe?: number | null
          total_alunos_9_classe?: number | null
          total_alunos_iniciacao?: number | null
          total_docentes?: number | null
          total_turmas?: number | null
          turmas_1_classe?: number | null
          turmas_10_classe?: number | null
          turmas_11_classe?: number | null
          turmas_12_classe?: number | null
          turmas_13_classe?: number | null
          turmas_2_classe?: number | null
          turmas_3_classe?: number | null
          turmas_4_classe?: number | null
          turmas_5_classe?: number | null
          turmas_6_classe?: number | null
          turmas_7_classe?: number | null
          turmas_8_classe?: number | null
          turmas_9_classe?: number | null
          turmas_iniciacao?: number | null
          updated_at?: string
        }
        Update: {
          alunos_fem_1_classe?: number | null
          alunos_fem_10_classe?: number | null
          alunos_fem_11_classe?: number | null
          alunos_fem_12_classe?: number | null
          alunos_fem_13_classe?: number | null
          alunos_fem_2_classe?: number | null
          alunos_fem_3_classe?: number | null
          alunos_fem_4_classe?: number | null
          alunos_fem_5_classe?: number | null
          alunos_fem_6_classe?: number | null
          alunos_fem_7_classe?: number | null
          alunos_fem_8_classe?: number | null
          alunos_fem_9_classe?: number | null
          alunos_fem_iniciacao?: number | null
          alunos_feminino?: number | null
          alunos_masc_1_classe?: number | null
          alunos_masc_10_classe?: number | null
          alunos_masc_11_classe?: number | null
          alunos_masc_12_classe?: number | null
          alunos_masc_13_classe?: number | null
          alunos_masc_2_classe?: number | null
          alunos_masc_3_classe?: number | null
          alunos_masc_4_classe?: number | null
          alunos_masc_5_classe?: number | null
          alunos_masc_6_classe?: number | null
          alunos_masc_7_classe?: number | null
          alunos_masc_8_classe?: number | null
          alunos_masc_9_classe?: number | null
          alunos_masc_iniciacao?: number | null
          alunos_masculino?: number | null
          codigo_organico?: string | null
          construcao?: string | null
          created_at?: string
          decreto_criacao?: string | null
          diretor?: string | null
          distancia_sede?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          prof_feminino?: number | null
          prof_masculino?: number | null
          residencia?: string | null
          telefone?: string | null
          total_alunos?: number | null
          total_alunos_1_classe?: number | null
          total_alunos_10_classe?: number | null
          total_alunos_11_classe?: number | null
          total_alunos_12_classe?: number | null
          total_alunos_13_classe?: number | null
          total_alunos_2_classe?: number | null
          total_alunos_3_classe?: number | null
          total_alunos_4_classe?: number | null
          total_alunos_5_classe?: number | null
          total_alunos_6_classe?: number | null
          total_alunos_7_classe?: number | null
          total_alunos_8_classe?: number | null
          total_alunos_9_classe?: number | null
          total_alunos_iniciacao?: number | null
          total_docentes?: number | null
          total_turmas?: number | null
          turmas_1_classe?: number | null
          turmas_10_classe?: number | null
          turmas_11_classe?: number | null
          turmas_12_classe?: number | null
          turmas_13_classe?: number | null
          turmas_2_classe?: number | null
          turmas_3_classe?: number | null
          turmas_4_classe?: number | null
          turmas_5_classe?: number | null
          turmas_6_classe?: number | null
          turmas_7_classe?: number | null
          turmas_8_classe?: number | null
          turmas_9_classe?: number | null
          turmas_iniciacao?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      professores: {
        Row: {
          actividade: string | null
          agente_transferido: boolean | null
          arquivo_pessoal: string | null
          bairro_localidade: string | null
          categoria: string | null
          comuna: string | null
          condicao_fisica: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          dependentes: string | null
          disciplina: string | null
          email: string | null
          escola_id: string | null
          estado_civil: string | null
          estado_saude: string | null
          formado_em: string | null
          foto_url: string | null
          funcao: string | null
          genero: string | null
          id: string
          idade: number | null
          inicio_funcao: string | null
          nivel_academico: string | null
          nome: string
          nome_parceira: string | null
          num_dependentes: number | null
          numero_agente: string | null
          numero_cadastro: string | null
          outro_familiar: string | null
          provincia: string | null
          qtd_processo_disciplinar: number | null
          regime_contrato: string | null
          status: string
          telefone: string | null
          telefone_parceira: string | null
          tempo_servico: string | null
          updated_at: string
        }
        Insert: {
          actividade?: string | null
          agente_transferido?: boolean | null
          arquivo_pessoal?: string | null
          bairro_localidade?: string | null
          categoria?: string | null
          comuna?: string | null
          condicao_fisica?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: string | null
          disciplina?: string | null
          email?: string | null
          escola_id?: string | null
          estado_civil?: string | null
          estado_saude?: string | null
          formado_em?: string | null
          foto_url?: string | null
          funcao?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          inicio_funcao?: string | null
          nivel_academico?: string | null
          nome: string
          nome_parceira?: string | null
          num_dependentes?: number | null
          numero_agente?: string | null
          numero_cadastro?: string | null
          outro_familiar?: string | null
          provincia?: string | null
          qtd_processo_disciplinar?: number | null
          regime_contrato?: string | null
          status?: string
          telefone?: string | null
          telefone_parceira?: string | null
          tempo_servico?: string | null
          updated_at?: string
        }
        Update: {
          actividade?: string | null
          agente_transferido?: boolean | null
          arquivo_pessoal?: string | null
          bairro_localidade?: string | null
          categoria?: string | null
          comuna?: string | null
          condicao_fisica?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          dependentes?: string | null
          disciplina?: string | null
          email?: string | null
          escola_id?: string | null
          estado_civil?: string | null
          estado_saude?: string | null
          formado_em?: string | null
          foto_url?: string | null
          funcao?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          inicio_funcao?: string | null
          nivel_academico?: string | null
          nome?: string
          nome_parceira?: string | null
          num_dependentes?: number | null
          numero_agente?: string | null
          numero_cadastro?: string | null
          outro_familiar?: string | null
          provincia?: string | null
          qtd_processo_disciplinar?: number | null
          regime_contrato?: string | null
          status?: string
          telefone?: string | null
          telefone_parceira?: string | null
          tempo_servico?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
