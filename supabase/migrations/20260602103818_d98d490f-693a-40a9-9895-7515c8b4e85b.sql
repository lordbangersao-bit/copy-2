
-- Fix security definer view warning
ALTER VIEW public.organizational_units SET (security_invoker = on);

-- ============= transfer_requests =============
CREATE TABLE public.transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  from_school_id uuid NOT NULL,
  to_school_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED','UNDER_REVIEW','APPROVED','EXECUTED','REJECTED')),
  requested_by uuid NOT NULL DEFAULT auth.uid(),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_comment text,
  executed_by uuid,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.transfer_requests TO authenticated;
GRANT ALL ON public.transfer_requests TO service_role;

ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read transfers by school access"
  ON public.transfer_requests FOR SELECT TO authenticated
  USING (
    public.can_access_school(auth.uid(), from_school_id)
    OR public.can_access_school(auth.uid(), to_school_id)
  );

CREATE POLICY "Operators create transfer requests"
  ON public.transfer_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.can_access_school(auth.uid(), from_school_id)
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND NOT public.has_role(auth.uid(), 'TECNICO')
  );

CREATE POLICY "Validators review transfers"
  ON public.transfer_requests FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
    OR (
      public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
      AND public.can_access_school(auth.uid(), from_school_id)
      AND public.can_access_school(auth.uid(), to_school_id)
    )
  );

CREATE TRIGGER trg_transfer_requests_updated_at
  BEFORE UPDATE ON public.transfer_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_transfer_requests_from ON public.transfer_requests(from_school_id, status);
CREATE INDEX idx_transfer_requests_to ON public.transfer_requests(to_school_id, status);
CREATE INDEX idx_transfer_requests_professor ON public.transfer_requests(professor_id);

-- ============= transfer_history =============
CREATE TABLE public.transfer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  from_school_id uuid,
  to_school_id uuid NOT NULL,
  transfer_request_id uuid REFERENCES public.transfer_requests(id) ON DELETE SET NULL,
  executed_by uuid NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.transfer_history TO authenticated;
GRANT ALL ON public.transfer_history TO service_role;

ALTER TABLE public.transfer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read transfer history by school access"
  ON public.transfer_history FOR SELECT TO authenticated
  USING (
    public.can_access_school(auth.uid(), to_school_id)
    OR (from_school_id IS NOT NULL AND public.can_access_school(auth.uid(), from_school_id))
    OR public.has_role(auth.uid(), 'AUDITOR')
  );

CREATE INDEX idx_transfer_history_professor ON public.transfer_history(professor_id, executed_at DESC);

-- ============= execute_transfer =============
CREATE OR REPLACE FUNCTION public.execute_transfer(_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r public.transfer_requests%ROWTYPE;
  prof_snapshot jsonb;
BEGIN
  SELECT * INTO r FROM public.transfer_requests WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer request not found'; END IF;
  IF r.status <> 'APPROVED' THEN
    RAISE EXCEPTION 'Only APPROVED transfers can be executed (current: %)', r.status;
  END IF;

  IF NOT (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
    OR (public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
        AND public.can_access_school(auth.uid(), r.from_school_id)
        AND public.can_access_school(auth.uid(), r.to_school_id))
  ) THEN
    RAISE EXCEPTION 'Not allowed to execute this transfer';
  END IF;

  SELECT to_jsonb(p.*) INTO prof_snapshot FROM public.professores p WHERE p.id = r.professor_id;

  INSERT INTO public.transfer_history (professor_id, from_school_id, to_school_id, transfer_request_id, executed_by, snapshot)
  VALUES (r.professor_id, r.from_school_id, r.to_school_id, r.id, auth.uid(), prof_snapshot);

  UPDATE public.professores SET escola_id = r.to_school_id, updated_at = now() WHERE id = r.professor_id;

  UPDATE public.transfer_requests
     SET status = 'EXECUTED', executed_by = auth.uid(), executed_at = now()
   WHERE id = _request_id;

  RETURN jsonb_build_object('ok', true, 'professor_id', r.professor_id, 'to_school_id', r.to_school_id);
END;
$$;
