
-- Tipo de expediente
CREATE TYPE public.tipo_expediente AS ENUM (
  'MAPA_FALTAS',
  'MAPA_SUBSIDIO_FERIAS',
  'MAPA_ESTATISTICO',
  'OUTRO'
);

-- Estado do workflow
CREATE TYPE public.estado_expediente AS ENUM (
  'SUBMETIDO',
  'EM_ANALISE',
  'APROVADO',
  'REJEITADO'
);

-- Tabela principal de expedientes
CREATE TABLE public.expedientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_expediente NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  estado estado_expediente NOT NULL DEFAULT 'SUBMETIDO',
  dados JSONB DEFAULT '{}'::jsonb,
  periodo_referencia TEXT,
  observacoes_revisao TEXT,
  submetido_por TEXT,
  analisado_por TEXT,
  data_submissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_analise TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Leitura de expedientes para autenticados"
ON public.expedientes FOR SELECT
USING (true);

CREATE POLICY "Inserir expedientes"
ON public.expedientes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins podem atualizar expedientes"
ON public.expedientes FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem excluir expedientes"
ON public.expedientes FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_expedientes_updated_at
BEFORE UPDATE ON public.expedientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_expedientes_escola ON public.expedientes(escola_id);
CREATE INDEX idx_expedientes_tipo ON public.expedientes(tipo);
CREATE INDEX idx_expedientes_estado ON public.expedientes(estado);
