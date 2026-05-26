ALTER TABLE public.expedientes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expedientes;