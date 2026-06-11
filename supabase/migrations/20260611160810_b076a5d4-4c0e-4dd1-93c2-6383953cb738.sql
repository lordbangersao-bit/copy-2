
-- 1. agent-photos bucket: restrict writes to authenticated
DROP POLICY IF EXISTS "Permitir upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de fotos" ON storage.objects;

CREATE POLICY "Agent photos insert (authenticated)" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'agent-photos' AND NOT public.has_role(auth.uid(), 'VIEWER') AND NOT public.has_role(auth.uid(), 'AUDITOR'));

CREATE POLICY "Agent photos update (authenticated)" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'agent-photos' AND NOT public.has_role(auth.uid(), 'VIEWER') AND NOT public.has_role(auth.uid(), 'AUDITOR'))
  WITH CHECK (bucket_id = 'agent-photos');

CREATE POLICY "Agent photos delete (managers)" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'agent-photos' AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL') OR public.has_role(auth.uid(), 'DIRECTOR_ESCOLA')));

-- 2. agent-documents: add UPDATE policy (was missing)
CREATE POLICY "agent-documents update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND EXISTS (
      SELECT 1 FROM public.professores p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND p.escola_id IS NOT NULL
        AND public.can_access_school(auth.uid(), p.escola_id)
    )
  )
  WITH CHECK (bucket_id = 'agent-documents');

-- 3. Close the "escola_id IS NULL" bypass on professores + agent_documents + storage
DROP POLICY IF EXISTS "Users can read accessible professores" ON public.professores;
DROP POLICY IF EXISTS "Users can read accessible professors" ON public.professores;
CREATE POLICY "Users can read accessible professors" ON public.professores
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (escola_id IS NOT NULL AND public.can_access_school(auth.uid(), escola_id))
  );

DROP POLICY IF EXISTS "Managers can insert professors" ON public.professores;
CREATE POLICY "Managers can insert professors" ON public.professores
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (
      escola_id IS NOT NULL
      AND public.can_access_school(auth.uid(), escola_id)
      AND NOT public.has_role(auth.uid(), 'TECNICO')
      AND NOT public.has_role(auth.uid(), 'VIEWER')
    )
  );

DROP POLICY IF EXISTS "Read agent docs by school access" ON public.agent_documents;
CREATE POLICY "Read agent docs by school access" ON public.agent_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.professores p
      WHERE p.id = agent_documents.professor_id
        AND (
          public.is_admin(auth.uid())
          OR (p.escola_id IS NOT NULL AND public.can_access_school(auth.uid(), p.escola_id))
        )
    )
  );

DROP POLICY IF EXISTS "Upload agent docs by school access" ON public.agent_documents;
CREATE POLICY "Upload agent docs by school access" ON public.agent_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND EXISTS (
      SELECT 1 FROM public.professores p
      WHERE p.id = agent_documents.professor_id
        AND (
          public.is_admin(auth.uid())
          OR (p.escola_id IS NOT NULL AND public.can_access_school(auth.uid(), p.escola_id))
        )
    )
  );

DROP POLICY IF EXISTS "agent-documents read" ON storage.objects;
CREATE POLICY "agent-documents read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND EXISTS (
      SELECT 1 FROM public.professores p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (
          public.is_admin(auth.uid())
          OR (p.escola_id IS NOT NULL AND public.can_access_school(auth.uid(), p.escola_id))
        )
    )
  );

DROP POLICY IF EXISTS "agent-documents insert" ON storage.objects;
CREATE POLICY "agent-documents insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agent-documents'
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND EXISTS (
      SELECT 1 FROM public.professores p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (
          public.is_admin(auth.uid())
          OR (p.escola_id IS NOT NULL AND public.can_access_school(auth.uid(), p.escola_id))
        )
    )
  );

-- 4. Restrict VIEWER role in can_access_school (was returning true for all schools)
CREATE OR REPLACE FUNCTION public.can_access_school(_user_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.active = true
    AND (
      ur.role = 'ADMIN'
      OR (ur.role IN ('GESTOR_PROVINCIAL','VALIDADOR_PROVINCIAL','AUDITOR') AND EXISTS (
        SELECT 1 FROM public.escolas e
        JOIN public.municipalities m ON e.municipality_id = m.id
        WHERE e.id = _school_id AND m.province_id = ur.province_id
      ))
      OR (ur.role = 'GESTOR_MUNICIPAL' AND EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = _school_id AND e.municipality_id = ur.municipality_id
      ))
      OR (ur.role = 'DIRECTOR_ESCOLA' AND ur.school_id = _school_id)
      OR (ur.role IN ('TECNICO','VIEWER') AND (
        ur.school_id = _school_id
        OR (ur.municipality_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.escolas e WHERE e.id = _school_id AND e.municipality_id = ur.municipality_id))
        OR (ur.province_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.escolas e JOIN public.municipalities m ON e.municipality_id = m.id WHERE e.id = _school_id AND m.province_id = ur.province_id))
      ))
    )
  )
$function$;

-- Also tighten get_accessible_school_ids for VIEWER (was returning ALL schools)
CREATE OR REPLACE FUNCTION public.get_accessible_school_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF _role IN ('ADMIN') THEN
    RETURN QUERY SELECT id FROM public.escolas;
  ELSIF _role IN ('GESTOR_PROVINCIAL','VALIDADOR_PROVINCIAL','AUDITOR') THEN
    RETURN QUERY SELECT e.id FROM public.escolas e
      JOIN public.municipalities m ON m.id = e.municipality_id
      WHERE m.province_id = _prov;
  ELSIF _role = 'GESTOR_MUNICIPAL' THEN
    RETURN QUERY SELECT id FROM public.escolas WHERE municipality_id = _muni;
  ELSIF _role = 'DIRECTOR_ESCOLA' THEN
    RETURN QUERY SELECT _school WHERE _school IS NOT NULL;
  ELSIF _role IN ('TECNICO','VIEWER') THEN
    RETURN QUERY
      SELECT e.id FROM public.escolas e
      WHERE e.id = _school
         OR (_muni IS NOT NULL AND e.municipality_id = _muni)
         OR (_prov IS NOT NULL AND EXISTS (SELECT 1 FROM public.municipalities m WHERE m.id = e.municipality_id AND m.province_id = _prov));
  END IF;
END;
$function$;
