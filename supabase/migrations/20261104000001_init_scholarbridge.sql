-- ============================================================================
-- SCHOLARBRIDGE CORE DATABASE MIGRATION (SUPABASE POSTGRESQL)
-- 12 core tables (including verification_logs and allowed_foundation_domains),
-- custom enums, indexes, and constraints.
-- Fixes D1 (12 tables count), D2 (application_open_date), D10 (allowlist check),
-- D12 (pg_trgm index), D9 (search_vector column)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. ENUMERATED TYPES
CREATE TYPE user_role AS ENUM ('student', 'admin');

CREATE TYPE education_level AS ENUM (
  'school_class_9_10',
  'school_class_11_12',
  'diploma_technical',
  'undergraduate_general',
  'undergraduate_technical',
  'postgraduate_general',
  'postgraduate_technical',
  'integrated_five_year'
);

CREATE TYPE institution_type AS ENUM (
  'government_school',
  'private_school',
  'aicte_approved',
  'ugc_recognized',
  'notified_top_class_institute',
  'naac_accredited',
  'other_recognized'
);

CREATE TYPE provider_type AS ENUM (
  'central_government',
  'state_government',
  'statutory_body_aicte_ugc',
  'private_foundation'
);

CREATE TYPE funding_classification AS ENUM (
  'merit_based',
  'need_welfare_based',
  'merit_cum_means'
);

CREATE TYPE verification_status AS ENUM (
  'verified',
  'verified_renewal_only',
  'deadline_not_verified',
  'expired',
  'flagged_for_review'
);

CREATE TYPE application_status AS ENUM (
  'Saved',
  'Researching',
  'Preparing',
  'Ready to apply',
  'Submitted',
  'Awaiting result',
  'Awarded',
  'Not selected',
  'Closed'
);

-- FOUNDATION DOMAINS ALLOWLIST TABLE (D10)
CREATE TABLE public.allowed_foundation_domains (
  domain TEXT PRIMARY KEY,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed verified foundation domains
INSERT INTO public.allowed_foundation_domains (domain, notes)
VALUES ('scholarships.reliancefoundation.org', 'Reliance Foundation Scholarship Portal');

-- Host Allowlist Validation Function (D10)
CREATE OR REPLACE FUNCTION public.is_allowed_scholarship_url(url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  host text;
BEGIN
  IF url IS NULL OR url !~ '^https://' THEN
    RETURN FALSE;
  END IF;
  host := substring(url from '^https://([^/:]+)');
  IF host IS NULL THEN
    RETURN FALSE;
  END IF;
  IF host ~* '(\.gov\.in|\.nic\.in|\.ac\.in)$' THEN
    RETURN TRUE;
  END IF;
  IF host = 'scholarships.reliancefoundation.org' THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- 2. TABLE: profiles (Student & Admin Profiles)
-- Collects only matching-relevant attributes; zero PII/financial account storage.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 80),
  education_level education_level,
  course_stream TEXT,
  course_year SMALLINT CHECK (course_year BETWEEN 1 AND 6),
  is_lateral_entry BOOLEAN NOT NULL DEFAULT FALSE,
  study_mode TEXT CHECK (study_mode IN ('regular_full_time', 'distance_correspondence', 'part_time')),
  domicile_state TEXT,
  institution_type institution_type,
  has_valid_aishe_code BOOLEAN,
  academic_percentage NUMERIC(5,2) CHECK (academic_percentage BETWEEN 0.00 AND 100.00),
  class_12_top_20_percentile BOOLEAN,
  gate_score SMALLINT CHECK (gate_score BETWEEN 0 AND 1000),
  ug_cgpa NUMERIC(4,2) CHECK (ug_cgpa BETWEEN 0.00 AND 10.00),
  annual_family_income_inr INTEGER CHECK (annual_family_income_inr >= 0),
  social_category TEXT CHECK (social_category IN ('General', 'OBC', 'EWS', 'SC', 'ST', 'DNT', 'Minority')),
  gender TEXT CHECK (gender IN ('Female', 'Male', 'Other', 'Prefer not to say')),
  age_years SMALLINT CHECK (age_years BETWEEN 10 AND 60),
  is_first_pg_degree BOOLEAN,
  has_disability_40_percent BOOLEAN,
  is_orphan_or_martyr_ward BOOLEAN,
  girls_in_family_applying SMALLINT CHECK (girls_in_family_applying >= 0),
  years_gap_after_qualifying_exam SMALLINT CHECK (years_gap_after_qualifying_exam >= 0),
  receiving_other_scholarship BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_days_before INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 3, 1],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE: scholarships (Core Catalog)
-- D2: application_open_date is lowercase
-- D9: generated search_vector column
-- D10: official URLs validated against allowlist
CREATE TABLE public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type provider_type NOT NULL,
  funding_type funding_classification NOT NULL,
  description TEXT NOT NULL,
  benefits_summary TEXT NOT NULL,
  max_annual_benefit_inr INTEGER,
  eligibility_summary TEXT NOT NULL,
  application_instructions TEXT NOT NULL,
  application_open_date DATE,
  student_deadline_at TIMESTAMPTZ,
  institute_verification_deadline_at TIMESTAMPTZ,
  state_nodal_deadline_at TIMESTAMPTZ,
  is_deadline_verified BOOLEAN NOT NULL DEFAULT FALSE,
  fresh_applications_open BOOLEAN NOT NULL DEFAULT TRUE,
  renewal_applications_open BOOLEAN NOT NULL DEFAULT TRUE,
  official_source_url TEXT NOT NULL CHECK (public.is_allowed_scholarship_url(official_source_url)),
  official_application_url TEXT NOT NULL CHECK (public.is_allowed_scholarship_url(official_application_url)),
  verification_status verification_status NOT NULL DEFAULT 'deadline_not_verified',
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(provider_name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(eligibility_summary, ''))
  ) STORED
);

-- D9: GIN index on search_vector
CREATE INDEX idx_scholarships_search_vector ON public.scholarships USING GIN (search_vector);
-- D12: pg_trgm index for typo-tolerant searching
CREATE INDEX idx_scholarships_name_trgm ON public.scholarships USING GIN (name gin_trgm_ops);
CREATE INDEX idx_scholarships_deadline ON public.scholarships (student_deadline_at);
CREATE INDEX idx_scholarships_funding ON public.scholarships (funding_type, provider_type);

-- 4. TABLE: scholarship_eligibility_rules (Structured AST Rules)
CREATE TABLE public.scholarship_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  allowed_education_levels education_level[] NOT NULL,
  max_income_inr INTEGER,
  allowed_states TEXT[], -- NULL means All India
  allowed_courses TEXT[], -- NULL means Any Stream
  rule_ast JSONB NOT NULL, -- Deterministic Boolean AST (AND/OR nodes + leaf conditions)
  eligibility_source_citation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scholarship_id, version)
);

CREATE INDEX idx_eligibility_edu_levels ON public.scholarship_eligibility_rules USING GIN (allowed_education_levels);
CREATE INDEX idx_eligibility_income ON public.scholarship_eligibility_rules (max_income_inr);

-- 5. TABLE: scholarship_documents (Required Document Templates)
CREATE TABLE public.scholarship_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  specification_notes TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  issuing_authority TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 1
);

-- 6. TABLE: scholarship_sources (Source Provenance)
CREATE TABLE public.scholarship_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL CHECK (public.is_allowed_scholarship_url(source_url)),
  guideline_pdf_url TEXT CHECK (guideline_pdf_url IS NULL OR public.is_allowed_scholarship_url(guideline_pdf_url)),
  is_primary_government_portal BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLE: saved_scholarships (Student Bookmarks)
CREATE TABLE public.saved_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  match_status_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

-- 8. TABLE: applications (Student Application Tracker)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'Saved',
  application_reference_id TEXT, -- e.g. NSP Application ID or OTR Reference
  private_notes TEXT, -- Strictly isolated via RLS; never exposed externally
  submitted_at TIMESTAMPTZ,
  target_submission_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

-- 9. TABLE: application_checklists (Checklist Containers)
CREATE TABLE public.application_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLE: checklist_items (Individual Preparation & Document Tasks)
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.application_checklists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  item_category TEXT NOT NULL CHECK (item_category IN ('document', 'registration', 'verification', 'test')),
  guidance_notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order SMALLINT NOT NULL DEFAULT 1
);

-- 11. TABLE: reminders (In-App Time-Zone-Aware Alerts)
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_label TEXT NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABLE: verification_logs (Immutable Admin Audit Trail)
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id),
  previous_status verification_status,
  new_status verification_status NOT NULL,
  verified_source_url TEXT NOT NULL CHECK (public.is_allowed_scholarship_url(verified_source_url)),
  change_summary TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
