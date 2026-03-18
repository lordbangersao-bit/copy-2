
-- ================================================
-- 1. ADD FOREIGN KEY CONSTRAINTS (missing from escolas)
-- ================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'escolas_municipality_id_fkey' AND table_name = 'escolas'
  ) THEN
    ALTER TABLE public.escolas 
      ADD CONSTRAINT escolas_municipality_id_fkey 
      FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'municipalities_province_id_fkey' AND table_name = 'municipalities'
  ) THEN
    ALTER TABLE public.municipalities 
      ADD CONSTRAINT municipalities_province_id_fkey 
      FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- FK for user_roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_province_id_fkey' AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_province_id_fkey 
      FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_municipality_id_fkey' AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_municipality_id_fkey 
      FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_school_id_fkey' AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_school_id_fkey 
      FOREIGN KEY (school_id) REFERENCES public.escolas(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'professores_escola_id_fkey' AND table_name = 'professores'
  ) THEN
    ALTER TABLE public.professores 
      ADD CONSTRAINT professores_escola_id_fkey 
      FOREIGN KEY (escola_id) REFERENCES public.escolas(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expedientes_escola_id_fkey' AND table_name = 'expedientes'
  ) THEN
    ALTER TABLE public.expedientes 
      ADD CONSTRAINT expedientes_escola_id_fkey 
      FOREIGN KEY (escola_id) REFERENCES public.escolas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ================================================
-- 2. CREATE STUDENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  class text NOT NULL,
  birthdate date,
  gender text,
  guardian_name text,
  guardian_phone text,
  enrollment_number text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 3. CREATE ATTENDANCE TABLE
-- ================================================
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  recorded_by uuid NOT NULL,
  notes text,
  synced boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 4. CREATE GRADES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  grade numeric(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 20),
  period text NOT NULL,
  recorded_by uuid NOT NULL,
  reason text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 5. CREATE INFRASTRUCTURE TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.infrastructure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  condition text NOT NULL DEFAULT 'bom',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.infrastructure ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 6. CREATE AUDIT_LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_role text,
  action_type text NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  reason text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 7. INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_escolas_municipality_id ON public.escolas(municipality_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_province_id ON public.municipalities(province_id);
CREATE INDEX IF NOT EXISTS idx_professores_escola_id ON public.professores(escola_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_province ON public.user_roles(province_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_municipality ON public.user_roles(municipality_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school ON public.user_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_school_id ON public.infrastructure(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expedientes_escola_id ON public.expedientes(escola_id);

-- ================================================
-- 8. RLS POLICIES FOR NEW TABLES
-- ================================================

-- STUDENTS
CREATE POLICY "Users can read accessible students" ON public.students
  FOR SELECT TO authenticated
  USING (can_access_school(auth.uid(), school_id));

CREATE POLICY "Managers can insert students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id) 
        AND NOT has_role(auth.uid(), 'TECNICO') 
        AND NOT has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can update students" ON public.students
  FOR UPDATE TO authenticated
  USING (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id) 
        AND NOT has_role(auth.uid(), 'TECNICO') 
        AND NOT has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can delete students" ON public.students
  FOR DELETE TO authenticated
  USING (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id) 
        AND (has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR has_role(auth.uid(), 'GESTOR_MUNICIPAL')))
  );

-- ATTENDANCE
CREATE POLICY "Users can read accessible attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    )
  );

CREATE POLICY "Staff can insert attendance" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    ) AND NOT has_role(auth.uid(), 'VIEWER')
  );

CREATE POLICY "Staff can update attendance" ON public.attendance
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    ) AND NOT has_role(auth.uid(), 'VIEWER') AND NOT has_role(auth.uid(), 'TECNICO')
  );

-- GRADES
CREATE POLICY "Users can read accessible grades" ON public.grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    )
  );

CREATE POLICY "Directors can insert grades" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    ) AND NOT has_role(auth.uid(), 'VIEWER') AND NOT has_role(auth.uid(), 'TECNICO')
  );

CREATE POLICY "Directors can update grades" ON public.grades
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND can_access_school(auth.uid(), s.school_id)
    ) AND NOT has_role(auth.uid(), 'VIEWER') AND NOT has_role(auth.uid(), 'TECNICO')
  );

-- INFRASTRUCTURE
CREATE POLICY "Users can read accessible infrastructure" ON public.infrastructure
  FOR SELECT TO authenticated
  USING (can_access_school(auth.uid(), school_id));

CREATE POLICY "Managers can insert infrastructure" ON public.infrastructure
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id) 
        AND NOT has_role(auth.uid(), 'TECNICO') 
        AND NOT has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can update infrastructure" ON public.infrastructure
  FOR UPDATE TO authenticated
  USING (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id) 
        AND NOT has_role(auth.uid(), 'TECNICO') 
        AND NOT has_role(auth.uid(), 'VIEWER'))
  );

CREATE POLICY "Managers can delete infrastructure" ON public.infrastructure
  FOR DELETE TO authenticated
  USING (
    is_admin(auth.uid())
    OR (can_access_school(auth.uid(), school_id)
        AND (has_role(auth.uid(), 'GESTOR_PROVINCIAL') OR has_role(auth.uid(), 'GESTOR_MUNICIPAL')))
  );

-- AUDIT_LOGS (only admins and provincial managers can read)
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    is_admin(auth.uid()) OR has_role(auth.uid(), 'GESTOR_PROVINCIAL')
  );

-- Allow trigger inserts (service role bypass, but also allow authenticated for edge function inserts)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ================================================
-- 9. AUDIT TRIGGER FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
  _record_id text;
  _old jsonb;
  _new jsonb;
BEGIN
  -- Get current user
  BEGIN
    _user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _user_id := NULL;
  END;

  -- Get role
  IF _user_id IS NOT NULL THEN
    SELECT role::text INTO _user_role FROM public.user_roles 
    WHERE user_id = _user_id AND active = true LIMIT 1;
  END IF;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _old := to_jsonb(OLD);
    _new := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _old := NULL;
    _new := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (user_id, user_role, action_type, table_name, record_id, old_data, new_data)
  VALUES (_user_id, _user_role, TG_OP, TG_TABLE_NAME, _record_id, _old, _new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ================================================
-- 10. ATTACH AUDIT TRIGGERS TO ALL TABLES
-- ================================================
DROP TRIGGER IF EXISTS audit_escolas ON public.escolas;
CREATE TRIGGER audit_escolas AFTER INSERT OR UPDATE OR DELETE ON public.escolas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_professores ON public.professores;
CREATE TRIGGER audit_professores AFTER INSERT OR UPDATE OR DELETE ON public.professores
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_students ON public.students;
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_attendance ON public.attendance;
CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_grades ON public.grades;
CREATE TRIGGER audit_grades AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_infrastructure ON public.infrastructure;
CREATE TRIGGER audit_infrastructure AFTER INSERT OR UPDATE OR DELETE ON public.infrastructure
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_expedientes ON public.expedientes;
CREATE TRIGGER audit_expedientes AFTER INSERT OR UPDATE OR DELETE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_municipalities ON public.municipalities;
CREATE TRIGGER audit_municipalities AFTER INSERT OR UPDATE OR DELETE ON public.municipalities
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_provinces ON public.provinces;
CREATE TRIGGER audit_provinces AFTER INSERT OR UPDATE OR DELETE ON public.provinces
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ================================================
-- 11. UPDATE TRIGGERS FOR updated_at
-- ================================================
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_infrastructure_updated_at ON public.infrastructure;
CREATE TRIGGER update_infrastructure_updated_at BEFORE UPDATE ON public.infrastructure
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for attendance (for offline sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
