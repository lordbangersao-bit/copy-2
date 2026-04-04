
-- Drop old permissive SELECT policy on municipalities
DROP POLICY IF EXISTS "Authenticated users can read municipalities" ON public.municipalities;

-- Create new hierarchical SELECT policy
CREATE POLICY "Users can read municipalities by jurisdiction"
ON public.municipalities FOR SELECT TO authenticated
USING (
  is_admin(auth.uid())
  OR (
    has_role(auth.uid(), 'GESTOR_PROVINCIAL') 
    AND province_id = get_user_province_id(auth.uid())
  )
  OR (
    has_role(auth.uid(), 'GESTOR_MUNICIPAL') 
    AND id = get_user_municipality_id(auth.uid())
  )
  OR (
    has_role(auth.uid(), 'DIRECTOR_ESCOLA') 
    AND id IN (
      SELECT e.municipality_id FROM public.escolas e 
      WHERE e.id = get_user_school_id(auth.uid())
    )
  )
  OR (
    has_role(auth.uid(), 'TECNICO') 
    AND (
      id = get_user_municipality_id(auth.uid())
      OR province_id = get_user_province_id(auth.uid())
      OR id IN (SELECT e.municipality_id FROM public.escolas e WHERE e.id = get_user_school_id(auth.uid()))
    )
  )
  OR has_role(auth.uid(), 'VIEWER')
);

-- Also allow GESTOR_PROVINCIAL to insert/update/delete municipalities in their province
DROP POLICY IF EXISTS "Admins can insert municipalities" ON public.municipalities;
DROP POLICY IF EXISTS "Admins can update municipalities" ON public.municipalities;
DROP POLICY IF EXISTS "Admins can delete municipalities" ON public.municipalities;

CREATE POLICY "Managers can insert municipalities"
ON public.municipalities FOR INSERT TO authenticated
WITH CHECK (
  is_admin(auth.uid())
  OR (has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND province_id = get_user_province_id(auth.uid()))
);

CREATE POLICY "Managers can update municipalities"
ON public.municipalities FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid())
  OR (has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND province_id = get_user_province_id(auth.uid()))
);

CREATE POLICY "Managers can delete municipalities"
ON public.municipalities FOR DELETE TO authenticated
USING (
  is_admin(auth.uid())
  OR (has_role(auth.uid(), 'GESTOR_PROVINCIAL') AND province_id = get_user_province_id(auth.uid()))
);
