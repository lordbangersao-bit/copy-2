
-- 1. Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'GESTOR_PROVINCIAL';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'GESTOR_MUNICIPAL';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'DIRECTOR_ESCOLA';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'TECNICO';

-- 2. Create provinces table
CREATE TABLE public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

-- 3. Create municipalities table
CREATE TABLE public.municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, province_id)
);
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

-- 4. Add municipality_id to escolas
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL;

-- 5. Add hierarchical columns to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL;

-- 6. Insert Cunene province and municipalities
INSERT INTO public.provinces (name, code) VALUES ('Cunene', 'CUN');

INSERT INTO public.municipalities (name, province_id, code)
SELECT m.name, p.id, m.code
FROM (VALUES 
  ('Ondjiva', 'OND'),
  ('Cuanhama', 'CUA'),
  ('Cahama', 'CAH'),
  ('Curoca', 'CUR'),
  ('Cuvelai', 'CUV'),
  ('Ombadja', 'OMB')
) AS m(name, code)
CROSS JOIN public.provinces p WHERE p.code = 'CUN';

-- 7. Helper functions (not referencing new enum values directly)
CREATE OR REPLACE FUNCTION public.get_user_province_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT province_id FROM public.user_roles
  WHERE user_id = _user_id AND active = true LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_municipality_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT municipality_id FROM public.user_roles
  WHERE user_id = _user_id AND active = true LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT school_id FROM public.user_roles
  WHERE user_id = _user_id AND active = true LIMIT 1
$$;

-- 8. RLS for provinces (simple, no new enum refs)
CREATE POLICY "Authenticated users can read provinces"
  ON public.provinces FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert provinces"
  ON public.provinces FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update provinces"
  ON public.provinces FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete provinces"
  ON public.provinces FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 9. RLS for municipalities (simple for now)
CREATE POLICY "Authenticated users can read municipalities"
  ON public.municipalities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert municipalities"
  ON public.municipalities FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update municipalities"
  ON public.municipalities FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete municipalities"
  ON public.municipalities FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 10. Timestamps triggers
CREATE TRIGGER update_provinces_updated_at BEFORE UPDATE ON public.provinces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_municipalities_updated_at BEFORE UPDATE ON public.municipalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_municipalities_province_id ON public.municipalities(province_id);
CREATE INDEX IF NOT EXISTS idx_escolas_municipality_id ON public.escolas(municipality_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_province_id ON public.user_roles(province_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_municipality_id ON public.user_roles(municipality_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school_id ON public.user_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_professores_escola_id ON public.professores(escola_id);

-- 12. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.provinces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.municipalities;
