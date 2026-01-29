-- Create a function to automatically assign ADMIN role to the first user
-- This function will be called via trigger when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users with roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role, active)
    VALUES (NEW.id, 'ADMIN', true);
  ELSE
    -- Otherwise, assign VIEWER role
    INSERT INTO public.user_roles (user_id, role, active)
    VALUES (NEW.id, 'VIEWER', true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to automatically assign role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();