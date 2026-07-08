
-- 1) NISS on professores
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS niss text;
CREATE INDEX IF NOT EXISTS idx_professores_niss ON public.professores(niss);
CREATE INDEX IF NOT EXISTS idx_professores_numero_agente_lower ON public.professores(lower(numero_agente));

-- 2) INSS Config (singleton row)
CREATE TABLE IF NOT EXISTS public.inss_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name text NOT NULL DEFAULT 'DIRECÇÃO MUNICIPAL DA EDUCAÇÃO DO NAMACUNDE',
  employer_niss text NOT NULL DEFAULT '5973657',
  employer_nif text NOT NULL DEFAULT '5000505188',
  decimal_format text NOT NULL DEFAULT 'pt-PT',
  currency text NOT NULL DEFAULT 'AOA',
  default_tipo text NOT NULL DEFAULT 'Normal',
  auto_backup boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.inss_config TO authenticated;
GRANT ALL ON public.inss_config TO service_role;
ALTER TABLE public.inss_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read inss_config" ON public.inss_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can update inss_config" ON public.inss_config
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Only admin can insert inss_config" ON public.inss_config
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.inss_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- 3) INSS Generations (audit)
CREATE TABLE IF NOT EXISTS public.inss_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_by uuid NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  reference_month text NOT NULL,
  tipo text NOT NULL DEFAULT 'Normal',
  source_filename text,
  employer_name text,
  employer_niss text,
  employer_nif text,
  total_employees int NOT NULL DEFAULT 0,
  employees_matched int NOT NULL DEFAULT 0,
  employees_missing_niss int NOT NULL DEFAULT 0,
  duplicates int NOT NULL DEFAULT 0,
  ignored_rows int NOT NULL DEFAULT 0,
  total_base numeric(18,2) NOT NULL DEFAULT 0,
  total_adicionais numeric(18,2) NOT NULL DEFAULT 0,
  total_bruto numeric(18,2) NOT NULL DEFAULT 0,
  export_format text NOT NULL DEFAULT 'xlsx',
  checksum text,
  version text NOT NULL DEFAULT '1.0.0',
  municipality_id uuid REFERENCES public.municipalities(id),
  province_id uuid REFERENCES public.provinces(id),
  payload jsonb
);
GRANT SELECT, INSERT ON public.inss_generations TO authenticated;
GRANT ALL ON public.inss_generations TO service_role;
ALTER TABLE public.inss_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own or scoped generations" ON public.inss_generations
  FOR SELECT TO authenticated USING (
    generated_by = auth.uid()
    OR public.is_admin(auth.uid())
    OR (public.has_role(auth.uid(),'GESTOR_PROVINCIAL') AND province_id = public.get_user_province_id(auth.uid()))
    OR (public.has_role(auth.uid(),'GESTOR_MUNICIPAL') AND municipality_id = public.get_user_municipality_id(auth.uid()))
  );
CREATE POLICY "Authorized roles insert generations" ON public.inss_generations
  FOR INSERT TO authenticated WITH CHECK (
    generated_by = auth.uid() AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(),'GESTOR_PROVINCIAL')
      OR public.has_role(auth.uid(),'GESTOR_MUNICIPAL')
    )
  );
