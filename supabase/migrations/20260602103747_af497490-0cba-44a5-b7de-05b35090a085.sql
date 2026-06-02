
-- Unified UO view
CREATE OR REPLACE VIEW public.organizational_units AS
  SELECT id, name, 'PROVINCE'::text AS type, NULL::uuid AS parent_id FROM public.provinces
  UNION ALL
  SELECT id, name, 'MUNICIPALITY'::text, province_id FROM public.municipalities
  UNION ALL
  SELECT id, nome, 'SCHOOL'::text, municipality_id FROM public.escolas;

GRANT SELECT ON public.organizational_units TO authenticated;

-- User UO resolver (most specific first)
CREATE OR REPLACE FUNCTION public.get_user_uo(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(school_id, municipality_id, province_id)
  FROM public.user_roles
  WHERE user_id = _user_id AND active = true
  LIMIT 1
$$;

-- Recursive descendants (self + all children)
CREATE OR REPLACE FUNCTION public.get_accessible_uos(_uo_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    SELECT id, parent_id FROM public.organizational_units WHERE id = _uo_id
    UNION ALL
    SELECT u.id, u.parent_id FROM public.organizational_units u
    JOIN tree t ON u.parent_id = t.id
  )
  SELECT id FROM tree
$$;

-- Set of school ids accessible to a user (used for dashboards/snapshots/deficit)
CREATE OR REPLACE FUNCTION public.get_accessible_school_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
  _prov uuid;
  _muni uuid;
  _school uuid;
BEGIN
  SELECT role, province_id, municipality_id, school_id
    INTO _role, _prov, _muni, _school
  FROM public.user_roles WHERE user_id = _user_id AND active = true LIMIT 1;

  IF _role IS NULL THEN RETURN; END IF;

  IF _role IN ('ADMIN','VIEWER','AUDITOR') THEN
    RETURN QUERY SELECT id FROM public.escolas;
  ELSIF _role IN ('GESTOR_PROVINCIAL','VALIDADOR_PROVINCIAL') THEN
    RETURN QUERY SELECT e.id FROM public.escolas e
      JOIN public.municipalities m ON m.id = e.municipality_id
      WHERE m.province_id = _prov;
  ELSIF _role = 'GESTOR_MUNICIPAL' THEN
    RETURN QUERY SELECT id FROM public.escolas WHERE municipality_id = _muni;
  ELSIF _role = 'DIRECTOR_ESCOLA' THEN
    RETURN QUERY SELECT _school WHERE _school IS NOT NULL;
  ELSIF _role = 'TECNICO' THEN
    RETURN QUERY
      SELECT e.id FROM public.escolas e
      WHERE e.id = _school
         OR e.municipality_id = _muni
         OR EXISTS (SELECT 1 FROM public.municipalities m WHERE m.id = e.municipality_id AND m.province_id = _prov);
  END IF;
END;
$$;
