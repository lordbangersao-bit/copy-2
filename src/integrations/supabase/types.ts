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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          professor_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          professor_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          professor_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          synced: boolean
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          synced?: boolean
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          synced?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
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
          created_by: string | null
          decreto_criacao: string | null
          diretor: string | null
          distancia_sede: string | null
          email: string | null
          endereco: string | null
          id: string
          municipality_id: string | null
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
          updated_by: string | null
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
          created_by?: string | null
          decreto_criacao?: string | null
          diretor?: string | null
          distancia_sede?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          municipality_id?: string | null
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
          updated_by?: string | null
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
          created_by?: string | null
          decreto_criacao?: string | null
          diretor?: string | null
          distancia_sede?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          municipality_id?: string | null
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
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escolas_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "deficit_by_municipality"
            referencedColumns: ["municipality_id"]
          },
          {
            foreignKeyName: "escolas_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      expedientes: {
        Row: {
          analisado_por: string | null
          created_at: string
          created_by: string | null
          dados: Json | null
          data_analise: string | null
          data_submissao: string
          descricao: string | null
          escola_id: string
          estado: Database["public"]["Enums"]["estado_expediente"]
          id: string
          observacoes_revisao: string | null
          periodo_referencia: string | null
          submetido_por: string | null
          tipo: Database["public"]["Enums"]["tipo_expediente"]
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          analisado_por?: string | null
          created_at?: string
          created_by?: string | null
          dados?: Json | null
          data_analise?: string | null
          data_submissao?: string
          descricao?: string | null
          escola_id: string
          estado?: Database["public"]["Enums"]["estado_expediente"]
          id?: string
          observacoes_revisao?: string | null
          periodo_referencia?: string | null
          submetido_por?: string | null
          tipo: Database["public"]["Enums"]["tipo_expediente"]
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          analisado_por?: string | null
          created_at?: string
          created_by?: string | null
          dados?: Json | null
          data_analise?: string | null
          data_submissao?: string
          descricao?: string | null
          escola_id?: string
          estado?: Database["public"]["Enums"]["estado_expediente"]
          id?: string
          observacoes_revisao?: string | null
          periodo_referencia?: string | null
          submetido_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_expediente"]
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          approved: boolean
          created_at: string
          grade: number
          id: string
          period: string
          reason: string | null
          recorded_by: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          grade: number
          id?: string
          period: string
          reason?: string | null
          recorded_by: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          grade?: number
          id?: string
          period?: string
          reason?: string | null
          recorded_by?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure: {
        Row: {
          condition: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          quantity: number
          school_id: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          quantity?: number
          school_id: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          quantity?: number
          school_id?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infrastructure_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      inss_config: {
        Row: {
          auto_backup: boolean
          currency: string
          decimal_format: string
          default_tipo: string
          employer_name: string
          employer_nif: string
          employer_niss: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_backup?: boolean
          currency?: string
          decimal_format?: string
          default_tipo?: string
          employer_name?: string
          employer_nif?: string
          employer_niss?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_backup?: boolean
          currency?: string
          decimal_format?: string
          default_tipo?: string
          employer_name?: string
          employer_nif?: string
          employer_niss?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      inss_generations: {
        Row: {
          checksum: string | null
          duplicates: number
          employees_matched: number
          employees_missing_niss: number
          employer_name: string | null
          employer_nif: string | null
          employer_niss: string | null
          export_format: string
          generated_at: string
          generated_by: string
          id: string
          ignored_rows: number
          municipality_id: string | null
          payload: Json | null
          province_id: string | null
          reference_month: string
          source_filename: string | null
          tipo: string
          total_adicionais: number
          total_base: number
          total_bruto: number
          total_employees: number
          version: string
        }
        Insert: {
          checksum?: string | null
          duplicates?: number
          employees_matched?: number
          employees_missing_niss?: number
          employer_name?: string | null
          employer_nif?: string | null
          employer_niss?: string | null
          export_format?: string
          generated_at?: string
          generated_by: string
          id?: string
          ignored_rows?: number
          municipality_id?: string | null
          payload?: Json | null
          province_id?: string | null
          reference_month: string
          source_filename?: string | null
          tipo?: string
          total_adicionais?: number
          total_base?: number
          total_bruto?: number
          total_employees?: number
          version?: string
        }
        Update: {
          checksum?: string | null
          duplicates?: number
          employees_matched?: number
          employees_missing_niss?: number
          employer_name?: string | null
          employer_nif?: string | null
          employer_niss?: string | null
          export_format?: string
          generated_at?: string
          generated_by?: string
          id?: string
          ignored_rows?: number
          municipality_id?: string | null
          payload?: Json | null
          province_id?: string | null
          reference_month?: string
          source_filename?: string | null
          tipo?: string
          total_adicionais?: number
          total_base?: number
          total_bruto?: number
          total_employees?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "inss_generations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "deficit_by_municipality"
            referencedColumns: ["municipality_id"]
          },
          {
            foreignKeyName: "inss_generations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inss_generations_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_documents: {
        Row: {
          created_at: string
          document_code: string
          document_hash: string
          document_number: string
          document_type: string
          id: string
          issued_at: string
          issued_by: string | null
          issued_by_name: string | null
          municipality: string
          payload: Json | null
          professor_id: string | null
          revoke_reason: string | null
          revoked: boolean
          revoked_at: string | null
          revoked_by: string | null
          school_id: string | null
          signature_hash: string
          title: string
        }
        Insert: {
          created_at?: string
          document_code: string
          document_hash: string
          document_number: string
          document_type: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          issued_by_name?: string | null
          municipality: string
          payload?: Json | null
          professor_id?: string | null
          revoke_reason?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          school_id?: string | null
          signature_hash: string
          title: string
        }
        Update: {
          created_at?: string
          document_code?: string
          document_hash?: string
          document_number?: string
          document_type?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          issued_by_name?: string | null
          municipality?: string
          payload?: Json | null
          professor_id?: string | null
          revoke_reason?: string | null
          revoked?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          school_id?: string | null
          signature_hash?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "issued_documents_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          province_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          province_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          province_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_changes: {
        Row: {
          created_at: string
          current_data: Json | null
          id: string
          municipality_id: string | null
          operation: string
          proposed_data: Json
          province_id: string | null
          record_id: string | null
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string | null
          status: string
          submitted_at: string
          submitted_by: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_data?: Json | null
          id?: string
          municipality_id?: string | null
          operation: string
          proposed_data?: Json
          province_id?: string | null
          record_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_data?: Json | null
          id?: string
          municipality_id?: string | null
          operation?: string
          proposed_data?: Json
          province_id?: string | null
          record_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          table_name?: string
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
          chave_unica: string | null
          comuna: string | null
          condicao_fisica: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
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
          niss: string | null
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
          updated_by: string | null
        }
        Insert: {
          actividade?: string | null
          agente_transferido?: boolean | null
          arquivo_pessoal?: string | null
          bairro_localidade?: string | null
          categoria?: string | null
          chave_unica?: string | null
          comuna?: string | null
          condicao_fisica?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
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
          niss?: string | null
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
          updated_by?: string | null
        }
        Update: {
          actividade?: string | null
          agente_transferido?: boolean | null
          arquivo_pessoal?: string | null
          bairro_localidade?: string | null
          categoria?: string | null
          chave_unica?: string | null
          comuna?: string | null
          condicao_fisica?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
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
          niss?: string | null
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
          updated_by?: string | null
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
      provinces: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      statistics_snapshots: {
        Row: {
          generated_at: string
          generated_by: string
          id: string
          locked: boolean
          payload: Json
          period_key: string
          period_type: string
          scope_id: string
          scope_name: string | null
          scope_type: string
          teachers_by_category: Json
          teachers_female: number
          teachers_male: number
          total_classes: number
          total_schools: number
          total_students: number
          total_teachers: number
        }
        Insert: {
          generated_at?: string
          generated_by?: string
          id?: string
          locked?: boolean
          payload?: Json
          period_key: string
          period_type: string
          scope_id: string
          scope_name?: string | null
          scope_type: string
          teachers_by_category?: Json
          teachers_female?: number
          teachers_male?: number
          total_classes?: number
          total_schools?: number
          total_students?: number
          total_teachers?: number
        }
        Update: {
          generated_at?: string
          generated_by?: string
          id?: string
          locked?: boolean
          payload?: Json
          period_key?: string
          period_type?: string
          scope_id?: string
          scope_name?: string | null
          scope_type?: string
          teachers_by_category?: Json
          teachers_female?: number
          teachers_male?: number
          total_classes?: number
          total_schools?: number
          total_students?: number
          total_teachers?: number
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          birthdate: string | null
          class: string
          created_at: string
          enrollment_number: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          birthdate?: string | null
          class: string
          created_at?: string
          enrollment_number?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          birthdate?: string | null
          class?: string
          created_at?: string
          enrollment_number?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_requirements: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          required_teachers: number
          school_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          required_teachers: number
          school_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          required_teachers?: number
          school_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      transfer_history: {
        Row: {
          executed_at: string
          executed_by: string
          from_school_id: string | null
          id: string
          professor_id: string
          snapshot: Json
          to_school_id: string
          transfer_request_id: string | null
        }
        Insert: {
          executed_at?: string
          executed_by: string
          from_school_id?: string | null
          id?: string
          professor_id: string
          snapshot?: Json
          to_school_id: string
          transfer_request_id?: string | null
        }
        Update: {
          executed_at?: string
          executed_by?: string
          from_school_id?: string | null
          id?: string
          professor_id?: string
          snapshot?: Json
          to_school_id?: string
          transfer_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_history_transfer_request_id_fkey"
            columns: ["transfer_request_id"]
            isOneToOne: false
            referencedRelation: "transfer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          created_at: string
          executed_at: string | null
          executed_by: string | null
          from_school_id: string
          id: string
          professor_id: string
          reason: string | null
          requested_at: string
          requested_by: string
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          from_school_id: string
          id?: string
          professor_id: string
          reason?: string | null
          requested_at?: string
          requested_by?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          from_school_id?: string
          id?: string
          professor_id?: string
          reason?: string | null
          requested_at?: string
          requested_by?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          municipality_id: string | null
          province_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          municipality_id?: string | null
          province_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          municipality_id?: string | null
          province_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "deficit_by_municipality"
            referencedColumns: ["municipality_id"]
          },
          {
            foreignKeyName: "user_roles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      deficit_by_municipality: {
        Row: {
          current_teachers: number | null
          deficit: number | null
          municipality_id: string | null
          municipality_name: string | null
          province_id: string | null
          required_teachers: number | null
          severity: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_units: {
        Row: {
          id: string | null
          name: string | null
          parent_id: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_pending_change: { Args: { _pending_id: string }; Returns: Json }
      can_access_school: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      can_validate_change: {
        Args: {
          _municipality: string
          _province: string
          _school: string
          _user_id: string
        }
        Returns: boolean
      }
      consulta_publica_agente: {
        Args: { _bi: string; _chave: string; _numero_agente: string }
        Returns: {
          categoria: string
          data_admissao: string
          disciplina: string
          funcao: string
          municipio: string
          nivel_academico: string
          nome: string
          numero_agente: string
          provincia: string
          regime_contrato: string
          status: string
          unidade_organica: string
        }[]
      }
      execute_transfer: { Args: { _request_id: string }; Returns: Json }
      generate_snapshot: {
        Args: {
          _period_key: string
          _period_type: string
          _scope_id: string
          _scope_type: string
        }
        Returns: string
      }
      get_accessible_school_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_accessible_uos: { Args: { _uo_id: string }; Returns: string[] }
      get_user_municipality_id: { Args: { _user_id: string }; Returns: string }
      get_user_province_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      get_user_uo: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "ADMIN"
        | "VIEWER"
        | "GESTOR_PROVINCIAL"
        | "GESTOR_MUNICIPAL"
        | "DIRECTOR_ESCOLA"
        | "TECNICO"
        | "VALIDADOR_PROVINCIAL"
        | "AUDITOR"
      attendance_status: "present" | "absent" | "late"
      estado_expediente: "SUBMETIDO" | "EM_ANALISE" | "APROVADO" | "REJEITADO"
      tipo_expediente:
        | "MAPA_FALTAS"
        | "MAPA_SUBSIDIO_FERIAS"
        | "MAPA_ESTATISTICO"
        | "OUTRO"
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
    Enums: {
      app_role: [
        "ADMIN",
        "VIEWER",
        "GESTOR_PROVINCIAL",
        "GESTOR_MUNICIPAL",
        "DIRECTOR_ESCOLA",
        "TECNICO",
        "VALIDADOR_PROVINCIAL",
        "AUDITOR",
      ],
      attendance_status: ["present", "absent", "late"],
      estado_expediente: ["SUBMETIDO", "EM_ANALISE", "APROVADO", "REJEITADO"],
      tipo_expediente: [
        "MAPA_FALTAS",
        "MAPA_SUBSIDIO_FERIAS",
        "MAPA_ESTATISTICO",
        "OUTRO",
      ],
    },
  },
} as const
