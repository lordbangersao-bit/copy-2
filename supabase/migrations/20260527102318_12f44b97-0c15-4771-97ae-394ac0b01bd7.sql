
-- Ensure pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Private bucket for agent documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents', 'agent-documents', false, 10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Metadata table
CREATE TABLE IF NOT EXISTS public.agent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('BI','CERTIFICADO','DIPLOMA','CONTRATO','DECLARACAO','OUTRO')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.agent_documents TO authenticated;
GRANT ALL ON public.agent_documents TO service_role;

ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_documents_professor
  ON public.agent_documents (professor_id, created_at DESC);

CREATE POLICY "Read agent docs by school access"
  ON public.agent_documents FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.professores p WHERE p.id = agent_documents.professor_id
            AND (p.escola_id IS NULL OR public.can_access_school(auth.uid(), p.escola_id)))
  );

CREATE POLICY "Upload agent docs by school access"
  ON public.agent_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND EXISTS (SELECT 1 FROM public.professores p WHERE p.id = agent_documents.professor_id
                AND (p.escola_id IS NULL OR public.can_access_school(auth.uid(), p.escola_id)))
  );

CREATE POLICY "Delete agent docs by managers"
  ON public.agent_documents FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      EXISTS (SELECT 1 FROM public.professores p WHERE p.id = agent_documents.professor_id
              AND p.escola_id IS NOT NULL AND public.can_access_school(auth.uid(), p.escola_id))
      AND (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL'))
    )
  );

-- Storage policies
CREATE POLICY "agent-documents read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND EXISTS (SELECT 1 FROM public.professores p
                WHERE p.id::text = (storage.foldername(name))[1]
                  AND (p.escola_id IS NULL OR public.can_access_school(auth.uid(), p.escola_id)))
  );

CREATE POLICY "agent-documents insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agent-documents'
    AND NOT public.has_role(auth.uid(), 'VIEWER')
    AND NOT public.has_role(auth.uid(), 'AUDITOR')
    AND EXISTS (SELECT 1 FROM public.professores p
                WHERE p.id::text = (storage.foldername(name))[1]
                  AND (p.escola_id IS NULL OR public.can_access_school(auth.uid(), p.escola_id)))
  );

CREATE POLICY "agent-documents delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.professores p
                 WHERE p.id::text = (storage.foldername(name))[1]
                   AND p.escola_id IS NOT NULL
                   AND public.can_access_school(auth.uid(), p.escola_id)
                   AND (public.has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR public.has_role(auth.uid(), 'GESTOR_MUNICIPAL')))
    )
  );

DROP TRIGGER IF EXISTS trg_audit_agent_documents ON public.agent_documents;
CREATE TRIGGER trg_audit_agent_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_professores_escola_status ON public.professores (escola_id, status);
CREATE INDEX IF NOT EXISTS idx_professores_nome_trgm ON public.professores USING gin (lower(nome) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_escolas_municipality ON public.escolas (municipality_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_escola_estado_data ON public.expedientes (escola_id, estado, data_submissao DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance (student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_infrastructure_school ON public.infrastructure (school_id);
