-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'VIEWER');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'VIEWER',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND active = true
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'ADMIN')
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND active = true
  LIMIT 1
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update escolas RLS policies to restrict edits to admins only
DROP POLICY IF EXISTS "Permitir atualização de escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir exclusão de escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir inserção de escolas" ON public.escolas;
DROP POLICY IF EXISTS "Permitir leitura pública de escolas" ON public.escolas;

CREATE POLICY "Leitura de escolas para autenticados"
ON public.escolas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins podem inserir escolas"
ON public.escolas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar escolas"
ON public.escolas
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem excluir escolas"
ON public.escolas
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update professores RLS policies to restrict edits to admins only
DROP POLICY IF EXISTS "Permitir atualização de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir exclusão de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir inserção de professores" ON public.professores;
DROP POLICY IF EXISTS "Permitir leitura pública de professores" ON public.professores;

CREATE POLICY "Leitura de professores para autenticados"
ON public.professores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins podem inserir professores"
ON public.professores
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar professores"
ON public.professores
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem excluir professores"
ON public.professores
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();