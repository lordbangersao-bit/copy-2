
CREATE POLICY "Authenticated read inss templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'inss-templates');
CREATE POLICY "Admins manage inss templates" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'inss-templates' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'inss-templates' AND public.is_admin(auth.uid()));
