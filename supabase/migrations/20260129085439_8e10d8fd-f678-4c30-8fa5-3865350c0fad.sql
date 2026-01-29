-- Adicionar campo de foto do agente
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS foto_url TEXT DEFAULT NULL;

-- Criar bucket de armazenamento para fotos dos agentes
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-photos', 'agent-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública de fotos
CREATE POLICY "Fotos de agentes são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-photos');

-- Política para permitir upload de fotos
CREATE POLICY "Permitir upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agent-photos');

-- Política para permitir atualização de fotos
CREATE POLICY "Permitir atualização de fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agent-photos');

-- Política para permitir exclusão de fotos
CREATE POLICY "Permitir exclusão de fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'agent-photos');