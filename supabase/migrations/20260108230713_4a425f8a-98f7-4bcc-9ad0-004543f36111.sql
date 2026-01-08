-- Tabela de Escolas
CREATE TABLE public.escolas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    diretor TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Professores
CREATE TABLE public.professores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    email TEXT,
    telefone TEXT,
    disciplina TEXT,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
    data_admissao DATE,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura (sistema municipal)
CREATE POLICY "Permitir leitura pública de escolas" 
ON public.escolas 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de escolas" 
ON public.escolas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de escolas" 
ON public.escolas 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de escolas" 
ON public.escolas 
FOR DELETE 
USING (true);

CREATE POLICY "Permitir leitura pública de professores" 
ON public.professores 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção de professores" 
ON public.professores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de professores" 
ON public.professores 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão de professores" 
ON public.professores 
FOR DELETE 
USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_escolas_updated_at
BEFORE UPDATE ON public.escolas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professores_updated_at
BEFORE UPDATE ON public.professores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();