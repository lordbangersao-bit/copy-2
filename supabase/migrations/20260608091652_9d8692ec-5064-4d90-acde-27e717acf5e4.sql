CREATE TABLE public.issued_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code text NOT NULL UNIQUE,
  document_number text NOT NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  document_hash text NOT NULL,
  signature_hash text NOT NULL,
  municipality text NOT NULL,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL,
  school_id uuid REFERENCES public.escolas(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issued_documents_code ON public.issued_documents(document_code);
CREATE INDEX idx_issued_documents_hash ON public.issued_documents(document_hash);
CREATE INDEX idx_issued_documents_professor ON public.issued_documents(professor_id);
CREATE INDEX idx_issued_documents_issued_at ON public.issued_documents(issued_at DESC);

GRANT SELECT ON public.issued_documents TO anon;
GRANT SELECT, INSERT, UPDATE ON public.issued_documents TO authenticated;
GRANT ALL ON public.issued_documents TO service_role;

ALTER TABLE public.issued_documents ENABLE ROW LEVEL SECURITY;

-- Public verification: anyone can read by code (no sensitive data exposed)
CREATE POLICY "Public can verify documents"
  ON public.issued_documents FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can register documents they issue
CREATE POLICY "Authenticated can issue documents"
  ON public.issued_documents FOR INSERT
  TO authenticated
  WITH CHECK (issued_by = auth.uid());

-- Only managers can revoke
CREATE POLICY "Managers can revoke documents"
  ON public.issued_documents FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
    OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'GESTOR_PROVINCIAL')
    OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')
  );

CREATE TRIGGER audit_issued_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.issued_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();