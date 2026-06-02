
-- ============= statistics_snapshots =============
CREATE TABLE public.statistics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('PROVINCE','MUNICIPALITY','SCHOOL')),
  scope_id uuid NOT NULL,
  scope_name text,
  period_type text NOT NULL CHECK (period_type IN ('DAILY','MONTHLY','YEARLY')),
  period_key text NOT NULL,
  total_teachers int NOT NULL DEFAULT 0,
  teachers_male int NOT NULL DEFAULT 0,
  teachers_female int NOT NULL DEFAULT 0,
  teachers_by_category jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_schools int NOT NULL DEFAULT 0,
  total_students int NOT NULL DEFAULT 0,
  total_classes int NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid NOT NULL DEFAULT auth.uid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT true,
  UNIQUE (scope_type, scope_id, period_type, period_key)
);

GRANT SELECT, INSERT ON public.statistics_snapshots TO authenticated;
GRANT ALL ON public.statistics_snapshots TO service_role;

ALTER TABLE public.statistics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read snapshots by scope"
  ON public.statistics_snapshots FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'AUDITOR')
    OR (scope_type = 'SCHOOL' AND public.can_access_school(auth.uid(), scope_id))
    OR (scope_type = 'MUNICIPALITY' AND (
        public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
        OR public.has_role(auth.uid(), 'VALIDADOR_PROVINCIAL')
        OR public.get_user_municipality_id(auth.uid()) = scope_id
    ))
    OR (scope_type = 'PROVINCE' AND public.get_user_province_id(auth.uid()) = scope_id)
  );

CREATE POLICY "Managers generate snapshots"
  ON public.statistics_snapshots FOR INSERT TO authenticated
  WITH CHECK (
    generated_by = auth.uid()
    AND (
      public.is_admin(auth.uid())
      OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
      OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
    )
  );

CREATE INDEX idx_snapshots_scope ON public.statistics_snapshots(scope_type, scope_id, period_type, period_key DESC);

-- generate_snapshot function
CREATE OR REPLACE FUNCTION public.generate_snapshot(
  _scope_type text, _scope_id uuid, _period_type text, _period_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _snap_id uuid;
  _scope_name text;
  _school_ids uuid[];
  _total_teachers int := 0;
  _t_male int := 0;
  _t_female int := 0;
  _by_cat jsonb := '{}'::jsonb;
  _total_schools int := 0;
  _total_students int := 0;
BEGIN
  -- Permission check
  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
    OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
  ) THEN
    RAISE EXCEPTION 'Not allowed to generate snapshots';
  END IF;

  -- Resolve scope -> school ids and name
  IF _scope_type = 'PROVINCE' THEN
    SELECT name INTO _scope_name FROM public.provinces WHERE id = _scope_id;
    SELECT array_agg(e.id) INTO _school_ids
      FROM public.escolas e JOIN public.municipalities m ON m.id = e.municipality_id
      WHERE m.province_id = _scope_id;
  ELSIF _scope_type = 'MUNICIPALITY' THEN
    SELECT name INTO _scope_name FROM public.municipalities WHERE id = _scope_id;
    SELECT array_agg(id) INTO _school_ids FROM public.escolas WHERE municipality_id = _scope_id;
  ELSIF _scope_type = 'SCHOOL' THEN
    SELECT nome INTO _scope_name FROM public.escolas WHERE id = _scope_id;
    _school_ids := ARRAY[_scope_id];
  ELSE
    RAISE EXCEPTION 'Invalid scope_type %', _scope_type;
  END IF;

  _school_ids := COALESCE(_school_ids, ARRAY[]::uuid[]);
  _total_schools := array_length(_school_ids, 1);

  SELECT
    count(*),
    count(*) FILTER (WHERE lower(genero) = 'masculino'),
    count(*) FILTER (WHERE lower(genero) = 'feminino')
  INTO _total_teachers, _t_male, _t_female
  FROM public.professores
  WHERE escola_id = ANY(_school_ids) AND status = 'ativo';

  SELECT COALESCE(jsonb_object_agg(coalesce(categoria,'N/D'), c), '{}'::jsonb) INTO _by_cat
  FROM (
    SELECT categoria, count(*) AS c FROM public.professores
    WHERE escola_id = ANY(_school_ids) AND status = 'ativo'
    GROUP BY categoria
  ) x;

  SELECT count(*) INTO _total_students FROM public.students
   WHERE school_id = ANY(_school_ids) AND active = true;

  INSERT INTO public.statistics_snapshots (
    scope_type, scope_id, scope_name, period_type, period_key,
    total_teachers, teachers_male, teachers_female, teachers_by_category,
    total_schools, total_students, payload
  ) VALUES (
    _scope_type, _scope_id, _scope_name, _period_type, _period_key,
    _total_teachers, _t_male, _t_female, _by_cat,
    COALESCE(_total_schools,0), _total_students,
    jsonb_build_object('generated_at', now(), 'school_ids', _school_ids)
  )
  ON CONFLICT (scope_type, scope_id, period_type, period_key)
  DO UPDATE SET
    total_teachers = EXCLUDED.total_teachers,
    teachers_male = EXCLUDED.teachers_male,
    teachers_female = EXCLUDED.teachers_female,
    teachers_by_category = EXCLUDED.teachers_by_category,
    total_schools = EXCLUDED.total_schools,
    total_students = EXCLUDED.total_students,
    payload = EXCLUDED.payload,
    generated_at = now(),
    generated_by = auth.uid()
  RETURNING id INTO _snap_id;

  RETURN _snap_id;
END;
$$;

-- ============= teacher_requirements =============
CREATE TABLE public.teacher_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE,
  required_teachers int NOT NULL CHECK (required_teachers >= 0),
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_requirements TO authenticated;
GRANT ALL ON public.teacher_requirements TO service_role;

ALTER TABLE public.teacher_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read requirements by school access"
  ON public.teacher_requirements FOR SELECT TO authenticated
  USING (public.can_access_school(auth.uid(), school_id));

CREATE POLICY "Managers write requirements"
  ON public.teacher_requirements FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_school(auth.uid(), school_id)
    AND (public.is_admin(auth.uid())
         OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
         OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL'))
  );

CREATE POLICY "Managers update requirements"
  ON public.teacher_requirements FOR UPDATE TO authenticated
  USING (
    public.can_access_school(auth.uid(), school_id)
    AND (public.is_admin(auth.uid())
         OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
         OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL'))
  );

CREATE POLICY "Admins delete requirements"
  ON public.teacher_requirements FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL'));

CREATE TRIGGER trg_teacher_requirements_updated_at
  BEFORE UPDATE ON public.teacher_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= deficit_by_municipality view =============
CREATE OR REPLACE VIEW public.deficit_by_municipality
WITH (security_invoker = on) AS
WITH agg AS (
  SELECT
    m.id AS municipality_id,
    m.name AS municipality_name,
    m.province_id,
    COALESCE(SUM(tr.required_teachers), 0)::int AS required_teachers,
    (SELECT count(*)::int FROM public.professores p
       JOIN public.escolas e2 ON e2.id = p.escola_id
      WHERE e2.municipality_id = m.id AND p.status = 'ativo') AS current_teachers
  FROM public.municipalities m
  LEFT JOIN public.escolas e ON e.municipality_id = m.id
  LEFT JOIN public.teacher_requirements tr ON tr.school_id = e.id
  GROUP BY m.id, m.name, m.province_id
)
SELECT
  municipality_id, municipality_name, province_id,
  required_teachers, current_teachers,
  (required_teachers - current_teachers) AS deficit,
  CASE
    WHEN required_teachers = 0 THEN 'UNDEFINED'
    WHEN (required_teachers - current_teachers) <= 0 THEN 'SURPLUS'
    WHEN (required_teachers - current_teachers)::float / NULLIF(required_teachers,0) < 0.1 THEN 'LOW'
    WHEN (required_teachers - current_teachers)::float / NULLIF(required_teachers,0) < 0.25 THEN 'MODERATE'
    WHEN (required_teachers - current_teachers)::float / NULLIF(required_teachers,0) < 0.5 THEN 'CRITICAL'
    ELSE 'EMERGENCY'
  END AS severity
FROM agg;

GRANT SELECT ON public.deficit_by_municipality TO authenticated;
