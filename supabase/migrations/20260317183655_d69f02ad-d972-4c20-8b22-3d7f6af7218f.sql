
-- 1. Hierarchical access function
CREATE OR REPLACE FUNCTION public.can_access_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.active = true
    AND (
      ur.role = 'ADMIN'
      OR (ur.role = 'GESTOR_PROVINCIAL' AND EXISTS (
        SELECT 1 FROM public.escolas e 
        JOIN public.municipalities m ON e.municipality_id = m.id
        WHERE e.id = _school_id AND m.province_id = ur.province_id
      ))
      OR (ur.role = 'GESTOR_MUNICIPAL' AND EXISTS (
        SELECT 1 FROM public.escolas e
        WHERE e.id = _school_id AND e.municipality_id = ur.municipality_id
      ))
      OR (ur.role = 'DIRECTOR_ESCOLA' AND ur.school_id = _school_id)
      OR (ur.role = 'TECNICO' AND (
        ur.school_id = _school_id
        OR EXISTS (SELECT 1 FROM public.escolas e WHERE e.id = _school_id AND e.municipality_id = ur.municipality_id)
        OR EXISTS (SELECT 1 FROM public.escolas e JOIN public.municipalities m ON e.municipality_id = m.id WHERE e.id = _school_id AND m.province_id = ur.province_id)
      ))
      OR ur.role = 'VIEWER'
    )
  )
$$;

-- 2. Drop old permissive escolas policies
DROP POLICY IF EXISTS "Permitir leitura de escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir inserir escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir atualizar escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir excluir escolas" ON public.escolas;

CREATE POLICY "Users can read accessible schools"
  ON public.escolas FOR SELECT TO authenticated
  USING (public.can_access_school(auth.uid(), id));

CREATE POLICY "Managers can insert schools"
  ON public.escolas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND municipality_id IN (
      SELECT m.id FROM public.municipalities m WHERE m.province_id = public.get_user_province_id(auth.uid())
    ))
    OR (public.has_role(auth.uid(), 'GESTOR_MUNICIPAL') AND municipality_id = public.get_user_municipality_id(auth.uid()))
  );

CREATE POLICY "Managers can update schools"
  ON public.escolas FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND municipality_id IN (
      SELECT m.id FROM public.municipalities m WHERE m.province_id = public.get_user_province_id(auth.uid())
    ))
    OR (public.has_role(auth.uid(), 'GESTOR_MUNICIPAL') AND municipality_id = public.get_user_municipality_id(auth.uid()))
    OR (public.has_role(auth.uid(), 'DIRECTOR_ESCOLA') AND id = public.get_user_school_id(auth.uid()))
  );

CREATE POLICY "Admins and provincial can delete schools"
  ON public.escolas FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND municipality_id IN (
      SELECT m.id FROM public.municipalities m WHERE m.province_id = public.get_user_province_id(auth.uid())
    ))
  );

-- 3. Drop old permissive professores policies
DROP POLICY IF EXISTS "Permitir leitura de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir inserir professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir atualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir excluir professores" ON public.professores;

CREATE POLICY "Users can read accessible professors"
  ON public.professores FOR SELECT TO authenticated
  USING (escola_id IS NULL OR public.can_access_school(auth.uid(), escola_id));

CREATE POLICY "Managers can insert professors"
  ON public.professores FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (escola_id IS NOT NULL AND public.can_access_school(auth.uid(), escola_id)
        AND NOT public.has_role(auth.uid(), 'TECNICO')
        AND NOT public.has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can update professors"
  ON public.professores FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (escola_id IS NOT NULL AND public.can_access_school(auth.uid(), escola_id)
        AND NOT public.has_role(auth.uid(), 'TECNICO')
        AND NOT public.has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can delete professors"
  ON public.professores FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (escola_id IS NOT NULL AND public.can_access_school(auth.uid(), escola_id)
        AND (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')))
  );

-- 4. Drop old permissive expedientes policies
DROP POLICY IF EXISTS "Permitir leitura de expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Permitir inserir expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Permitir atualizar expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Permitir excluir expedientes" ON public.expedientes;

CREATE POLICY "Users can read accessible expedientes"
  ON public.expedientes FOR SELECT TO authenticated
  USING (public.can_access_school(auth.uid(), escola_id));

CREATE POLICY "Managers can insert expedientes"
  ON public.expedientes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR (public.can_access_school(auth.uid(), escola_id)
        AND NOT public.has_role(auth.uid(), 'TECNICO')
        AND NOT public.has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can update expedientes"
  ON public.expedientes FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (public.can_access_school(auth.uid(), escola_id)
        AND NOT public.has_role(auth.uid(), 'TECNICO')
        AND NOT public.has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Admins can delete expedientes"
  ON public.expedientes FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND public.can_access_school(auth.uid(), escola_id))
  );
