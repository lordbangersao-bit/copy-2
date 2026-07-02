
-- 1. Add chave_unica column
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS chave_unica text;

-- Backfill for existing rows (12 uppercase alphanumeric chars)
UPDATE public.professores
SET chave_unica = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12))
WHERE chave_unica IS NULL;

-- Trigger to auto-generate on insert
CREATE OR REPLACE FUNCTION public.set_chave_unica()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.chave_unica IS NULL OR NEW.chave_unica = '' THEN
    NEW.chave_unica := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_chave_unica ON public.professores;
CREATE TRIGGER trg_set_chave_unica
BEFORE INSERT ON public.professores
FOR EACH ROW EXECUTE FUNCTION public.set_chave_unica();

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS professores_chave_unica_uidx ON public.professores(chave_unica);

-- 2. Public RPC — SECURITY DEFINER, returns nothing unless all 3 match
CREATE OR REPLACE FUNCTION public.consulta_publica_agente(
  _numero_agente text,
  _bi text,
  _chave text
)
RETURNS TABLE (
  numero_agente text,
  nome text,
  categoria text,
  funcao text,
  disciplina text,
  nivel_academico text,
  regime_contrato text,
  data_admissao date,
  status text,
  unidade_organica text,
  municipio text,
  provincia text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _numero_agente IS NULL OR _bi IS NULL OR _chave IS NULL
     OR length(trim(_numero_agente)) = 0
     OR length(trim(_bi)) < 4
     OR length(trim(_chave)) < 6 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.numero_agente,
    p.nome,
    p.categoria,
    p.funcao,
    p.disciplina,
    p.nivel_academico,
    p.regime_contrato,
    p.data_admissao,
    p.status,
    e.nome AS unidade_organica,
    m.name AS municipio,
    pr.name AS provincia
  FROM public.professores p
  LEFT JOIN public.escolas e ON e.id = p.escola_id
  LEFT JOIN public.municipalities m ON m.id = e.municipality_id
  LEFT JOIN public.provinces pr ON pr.id = m.province_id
  WHERE upper(trim(p.numero_agente)) = upper(trim(_numero_agente))
    AND upper(trim(coalesce(p.cpf, ''))) = upper(trim(_bi))
    AND upper(trim(coalesce(p.chave_unica, ''))) = upper(trim(_chave))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consulta_publica_agente(text, text, text) TO anon, authenticated;
