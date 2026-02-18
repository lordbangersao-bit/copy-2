
-- Drop all restrictive policies and recreate as permissive

-- ESCOLAS
DROP POLICY IF EXISTS "Admins podem inserir escolas" ON public.escolas;
DROP POLICY IF EXISTS "Admins podem atualizar escolas" ON public.escolas;
DROP POLICY IF EXISTS "Admins podem excluir escolas" ON public.escolas;
DROP POLICY IF EXISTS "Leitura de escolas para autenticados" ON public.escolas;

CREATE POLICY "Permitir leitura de escolas" ON public.escolas FOR SELECT USING (true);
CREATE POLICY "Permitir inserir escolas" ON public.escolas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizar escolas" ON public.escolas FOR UPDATE USING (true);
CREATE POLICY "Permitir excluir escolas" ON public.escolas FOR DELETE USING (true);

-- PROFESSORES
DROP POLICY IF EXISTS "Admins podem inserir professores" ON public.professores;
DROP POLICY IF EXISTS "Admins podem atualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Admins podem excluir professores" ON public.professores;
DROP POLICY IF EXISTS "Leitura de professores para autenticados" ON public.professores;

CREATE POLICY "Permitir leitura de professores" ON public.professores FOR SELECT USING (true);
CREATE POLICY "Permitir inserir professores" ON public.professores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizar professores" ON public.professores FOR UPDATE USING (true);
CREATE POLICY "Permitir excluir professores" ON public.professores FOR DELETE USING (true);

-- EXPEDIENTES
DROP POLICY IF EXISTS "Admins podem atualizar expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Admins podem excluir expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Inserir expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Leitura de expedientes para autenticados" ON public.expedientes;

CREATE POLICY "Permitir leitura de expedientes" ON public.expedientes FOR SELECT USING (true);
CREATE POLICY "Permitir inserir expedientes" ON public.expedientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizar expedientes" ON public.expedientes FOR UPDATE USING (true);
CREATE POLICY "Permitir excluir expedientes" ON public.expedientes FOR DELETE USING (true);
