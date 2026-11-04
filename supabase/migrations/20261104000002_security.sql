-- ============================================================================
-- SCHOLARBRIDGE SECURITY MIGRATION (RLS, ROLES, VIEWS, TRIGGERS)
-- Fixes:
-- D7: Public log view omitting admin_user_id
-- D8: Role escalation prevention trigger + loosened profile update check
-- Updated_at triggers for automatic timestamp updating
-- ============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE public.allowed_foundation_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTION: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. TRIGGER: Updated_at automatic updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. D8: TRIGGER TO PREVENT ROLE SELF-ESCALATION
-- Rejects role mutations from ordinary user queries; only service_role/superuser can change role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- If user is attempting to change role, ensure they are service_role or superuser
    IF coalesce(current_setting('request.jwt.claim.role', true), '') != 'service_role'
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Role self-escalation is forbidden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- 5. RLS POLICIES FOR PROFILES
-- Students and admins can view own profile; admins can view all profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'student');

-- D8: Loosen check to auth.uid() = id so admins can also update their own profile; trigger protects role
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 6. RLS POLICIES FOR PUBLIC CATALOG TABLES
CREATE POLICY "Public read allowed domains" ON public.allowed_foundation_domains
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin mutate allowed domains" ON public.allowed_foundation_domains
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read scholarships" ON public.scholarships
  FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin mutate scholarships" ON public.scholarships
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read rules" ON public.scholarship_eligibility_rules
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin mutate rules" ON public.scholarship_eligibility_rules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read documents" ON public.scholarship_documents
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin mutate documents" ON public.scholarship_documents
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read sources" ON public.scholarship_sources
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin mutate sources" ON public.scholarship_sources
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. D7: VERIFICATION LOGS SECURITY & PUBLIC VIEW
-- Base table: Admin-only SELECT and Admin-only INSERT
CREATE POLICY "Admin read verification logs" ON public.verification_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert verification logs" ON public.verification_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- D7: Public view omitting admin_user_id for public transparency without leaking admin UUIDs
CREATE OR REPLACE VIEW public.verification_logs_public AS
  SELECT
    id,
    scholarship_id,
    previous_status,
    new_status,
    verified_source_url,
    change_summary,
    verified_at
  FROM public.verification_logs;

-- Grant public read access to the view
GRANT SELECT ON public.verification_logs_public TO anon, authenticated;

-- 8. RLS POLICIES FOR STUDENT RECORDS (STRICT OWNER ISOLATION)
CREATE POLICY "Student isolate saved_scholarships" ON public.saved_scholarships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Student isolate applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Student isolate checklists" ON public.application_checklists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Student isolate checklist_items" ON public.checklist_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Student isolate reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
