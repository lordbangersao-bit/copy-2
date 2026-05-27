
-- ============================================
-- PENDING CHANGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  proposed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_data jsonb,
  status text NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','APPLIED')),
  -- tenant scope (at least one must be set)
  province_id uuid,
  municipality_id uuid,
  school_id uuid,
  -- workflow
  submitted_by uuid NOT NULL DEFAULT auth.uid(),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pending_changes TO authenticated;
GRANT ALL ON public.pending_changes TO service_role;

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_pending_changes_updated_at ON public.pending_changes;
CREATE TRIGGER trg_pending_changes_updated_at
  BEFORE UPDATE ON public.pending_changes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- indexes
CREATE INDEX IF NOT EXISTS idx_pending_changes_status_submitted
  ON public.pending_changes (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_changes_scope
  ON public.pending_changes (school_id, municipality_id, province_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_submitter
  ON public.pending_changes (submitted_by, submitted_at DESC);

-- ============================================
-- Helper: can the user validate in given scope?
-- ============================================
CREATE OR REPLACE FUNCTION public.can_validate_change(_user_id uuid, _province uuid, _municipality uuid, _school uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.active = true
      AND (
        ur.role = 'ADMIN'
        OR (ur.role IN ('GESTOR_PROVINCIAL','VALIDADOR_PROVINCIAL')
            AND (_province IS NULL OR ur.province_id = _province
                 OR EXISTS (SELECT 1 FROM public.municipalities m WHERE m.id = _municipality AND m.province_id = ur.province_id)
                 OR EXISTS (SELECT 1 FROM public.escolas e JOIN public.municipalities m ON e.municipality_id = m.id WHERE e.id = _school AND m.province_id = ur.province_id)))
      )
  )
$$;

-- ============================================
-- RLS for pending_changes
-- ============================================

-- Author can read his own submissions
CREATE POLICY "Authors read own pending"
  ON public.pending_changes FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Validators / admins read in their scope
CREATE POLICY "Validators read scope pending"
  ON public.pending_changes FOR SELECT
  TO authenticated
  USING (public.can_validate_change(auth.uid(), province_id, municipality_id, school_id));

-- Auditor can read all
CREATE POLICY "Auditors read all pending"
  ON public.pending_changes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'AUDITOR'));

-- Authenticated managers/directors/technicians can submit (not viewers/auditors)
CREATE POLICY "Operators submit pending"
  ON public.pending_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
  );

-- Author can update their own DRAFT/SUBMITTED to edit before review
CREATE POLICY "Authors edit own draft"
  ON public.pending_changes FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid() AND status IN ('DRAFT','SUBMITTED'));

-- Validators can update status to APPROVED/REJECTED in their scope
CREATE POLICY "Validators decide pending"
  ON public.pending_changes FOR UPDATE
  TO authenticated
  USING (public.can_validate_change(auth.uid(), province_id, municipality_id, school_id));

-- ============================================
-- Apply function (SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_pending_change(_pending_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pc public.pending_changes%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO pc FROM public.pending_changes WHERE id = _pending_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending change not found';
  END IF;

  IF NOT public.can_validate_change(auth.uid(), pc.province_id, pc.municipality_id, pc.school_id) THEN
    RAISE EXCEPTION 'Not allowed to apply this change';
  END IF;

  IF pc.status <> 'APPROVED' THEN
    RAISE EXCEPTION 'Only APPROVED changes can be applied (current: %)', pc.status;
  END IF;

  IF pc.table_name NOT IN ('professores','escolas','infrastructure') THEN
    RAISE EXCEPTION 'Table % is not eligible for workflow', pc.table_name;
  END IF;

  -- Apply
  IF pc.operation = 'INSERT' THEN
    EXECUTE format('INSERT INTO public.%I SELECT * FROM jsonb_populate_record(NULL::public.%I, $1) RETURNING to_jsonb(public.%I.*)', pc.table_name, pc.table_name, pc.table_name)
      INTO result USING pc.proposed_data;
  ELSIF pc.operation = 'UPDATE' THEN
    EXECUTE format('UPDATE public.%I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)) WHERE id = $2 RETURNING to_jsonb(public.%I.*)',
      pc.table_name,
      (SELECT string_agg(quote_ident(key), ',') FROM jsonb_object_keys(pc.proposed_data) AS key),
      (SELECT string_agg(quote_ident(key), ',') FROM jsonb_object_keys(pc.proposed_data) AS key),
      pc.table_name,
      pc.table_name
    ) INTO result USING pc.proposed_data, pc.record_id;
  ELSIF pc.operation = 'DELETE' THEN
    EXECUTE format('DELETE FROM public.%I WHERE id = $1 RETURNING to_jsonb(public.%I.*)', pc.table_name, pc.table_name)
      INTO result USING pc.record_id;
  END IF;

  UPDATE public.pending_changes
    SET status = 'APPLIED', reviewed_by = COALESCE(reviewed_by, auth.uid()), reviewed_at = COALESCE(reviewed_at, now())
    WHERE id = _pending_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_pending_change(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_pending_change(uuid) TO authenticated;

-- Audit trigger on pending_changes
DROP TRIGGER IF EXISTS trg_audit_pending_changes ON public.pending_changes;
CREATE TRIGGER trg_audit_pending_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pending_changes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================
-- Add AUDITOR read access to audit_logs
-- ============================================
DROP POLICY IF EXISTS "Auditors can read audit logs" ON public.audit_logs;
CREATE POLICY "Auditors can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'AUDITOR'));

-- ============================================
-- Realtime for pending_changes
-- ============================================
ALTER TABLE public.pending_changes REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_changes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
