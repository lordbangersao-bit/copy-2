
-- Add new role values to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'VALIDADOR_PROVINCIAL';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'AUDITOR';

-- Add created_by / updated_by columns (default to current auth.uid())
ALTER TABLE public.professores
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE public.escolas
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE public.infrastructure
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Trigger function to set created_by / updated_by automatically
CREATE OR REPLACE FUNCTION public.set_audit_user_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach to relevant tables
DROP TRIGGER IF EXISTS trg_set_audit_user_professores ON public.professores;
CREATE TRIGGER trg_set_audit_user_professores
  BEFORE INSERT OR UPDATE ON public.professores
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_columns();

DROP TRIGGER IF EXISTS trg_set_audit_user_escolas ON public.escolas;
CREATE TRIGGER trg_set_audit_user_escolas
  BEFORE INSERT OR UPDATE ON public.escolas
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_columns();

DROP TRIGGER IF EXISTS trg_set_audit_user_expedientes ON public.expedientes;
CREATE TRIGGER trg_set_audit_user_expedientes
  BEFORE INSERT OR UPDATE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_columns();

DROP TRIGGER IF EXISTS trg_set_audit_user_infrastructure ON public.infrastructure;
CREATE TRIGGER trg_set_audit_user_infrastructure
  BEFORE INSERT OR UPDATE ON public.infrastructure
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_user_columns();

-- Index to speed up audit log lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record_created
  ON public.audit_logs (table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC);
