export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "admin";

export type EducationLevel =
  | "school_class_9_10"
  | "school_class_11_12"
  | "diploma_technical"
  | "undergraduate_general"
  | "undergraduate_technical"
  | "postgraduate_general"
  | "postgraduate_technical"
  | "integrated_five_year";

export type InstitutionType =
  | "government_school"
  | "private_school"
  | "aicte_approved"
  | "ugc_recognized"
  | "notified_top_class_institute"
  | "naac_accredited"
  | "other_recognized";

export type ProviderType =
  | "central_government"
  | "state_government"
  | "statutory_body_aicte_ugc"
  | "private_foundation";

export type FundingClassification =
  "merit_based" | "need_welfare_based" | "merit_cum_means";

export type VerificationStatus =
  | "verified"
  | "verified_renewal_only"
  | "deadline_not_verified"
  | "expired"
  | "flagged_for_review";

export type ApplicationStatus =
  | "Saved"
  | "Researching"
  | "Preparing"
  | "Ready to apply"
  | "Submitted"
  | "Awaiting result"
  | "Awarded"
  | "Not selected"
  | "Closed";

export interface Database {
  public: {
    Tables: {
      allowed_foundation_domains: {
        Row: {
          domain: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          domain: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          domain?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          education_level: EducationLevel | null;
          course_stream: string | null;
          course_year: number | null;
          is_lateral_entry: boolean;
          study_mode:
            | "regular_full_time"
            | "distance_correspondence"
            | "part_time"
            | null;
          domicile_state: string | null;
          institution_type: InstitutionType | null;
          has_valid_aishe_code: boolean | null;
          academic_percentage: number | null;
          class_12_top_20_percentile: boolean | null;
          gate_score: number | null;
          ug_cgpa: number | null;
          annual_family_income_inr: number | null;
          social_category:
            "General" | "OBC" | "EWS" | "SC" | "ST" | "DNT" | "Minority" | null;
          gender: "Female" | "Male" | "Other" | "Prefer not to say" | null;
          age_years: number | null;
          is_first_pg_degree: boolean | null;
          has_disability_40_percent: boolean | null;
          is_orphan_or_martyr_ward: boolean | null;
          girls_in_family_applying: number | null;
          years_gap_after_qualifying_exam: number | null;
          receiving_other_scholarship: boolean;
          reminder_days_before: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name: string;
          education_level?: EducationLevel | null;
          course_stream?: string | null;
          course_year?: number | null;
          is_lateral_entry?: boolean;
          study_mode?:
            | "regular_full_time"
            | "distance_correspondence"
            | "part_time"
            | null;
          domicile_state?: string | null;
          institution_type?: InstitutionType | null;
          has_valid_aishe_code?: boolean | null;
          academic_percentage?: number | null;
          class_12_top_20_percentile?: boolean | null;
          gate_score?: number | null;
          ug_cgpa?: number | null;
          annual_family_income_inr?: number | null;
          social_category?:
            "General" | "OBC" | "EWS" | "SC" | "ST" | "DNT" | "Minority" | null;
          gender?: "Female" | "Male" | "Other" | "Prefer not to say" | null;
          age_years?: number | null;
          is_first_pg_degree?: boolean | null;
          has_disability_40_percent?: boolean | null;
          is_orphan_or_martyr_ward?: boolean | null;
          girls_in_family_applying?: number | null;
          years_gap_after_qualifying_exam?: number | null;
          receiving_other_scholarship?: boolean;
          reminder_days_before?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string;
          education_level?: EducationLevel | null;
          course_stream?: string | null;
          course_year?: number | null;
          is_lateral_entry?: boolean;
          study_mode?:
            | "regular_full_time"
            | "distance_correspondence"
            | "part_time"
            | null;
          domicile_state?: string | null;
          institution_type?: InstitutionType | null;
          has_valid_aishe_code?: boolean | null;
          academic_percentage?: number | null;
          class_12_top_20_percentile?: boolean | null;
          gate_score?: number | null;
          ug_cgpa?: number | null;
          annual_family_income_inr?: number | null;
          social_category?:
            "General" | "OBC" | "EWS" | "SC" | "ST" | "DNT" | "Minority" | null;
          gender?: "Female" | "Male" | "Other" | "Prefer not to say" | null;
          age_years?: number | null;
          is_first_pg_degree?: boolean | null;
          has_disability_40_percent?: boolean | null;
          is_orphan_or_martyr_ward?: boolean | null;
          girls_in_family_applying?: number | null;
          years_gap_after_qualifying_exam?: number | null;
          receiving_other_scholarship?: boolean;
          reminder_days_before?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scholarships: {
        Row: {
          id: string;
          code: string;
          slug: string;
          name: string;
          provider_name: string;
          provider_type: ProviderType;
          funding_type: FundingClassification;
          description: string;
          benefits_summary: string;
          max_annual_benefit_inr: number | null;
          eligibility_summary: string;
          application_instructions: string;
          application_open_date: string | null;
          student_deadline_at: string | null;
          institute_verification_deadline_at: string | null;
          state_nodal_deadline_at: string | null;
          is_deadline_verified: boolean;
          fresh_applications_open: boolean;
          renewal_applications_open: boolean;
          official_source_url: string;
          official_application_url: string;
          verification_status: VerificationStatus;
          last_verified_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          search_vector: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          slug: string;
          name: string;
          provider_name: string;
          provider_type: ProviderType;
          funding_type: FundingClassification;
          description: string;
          benefits_summary: string;
          max_annual_benefit_inr?: number | null;
          eligibility_summary: string;
          application_instructions: string;
          application_open_date?: string | null;
          student_deadline_at?: string | null;
          institute_verification_deadline_at?: string | null;
          state_nodal_deadline_at?: string | null;
          is_deadline_verified?: boolean;
          fresh_applications_open?: boolean;
          renewal_applications_open?: boolean;
          official_source_url: string;
          official_application_url: string;
          verification_status?: VerificationStatus;
          last_verified_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          search_vector?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          slug?: string;
          name?: string;
          provider_name?: string;
          provider_type?: ProviderType;
          funding_type?: FundingClassification;
          description?: string;
          benefits_summary?: string;
          max_annual_benefit_inr?: number | null;
          eligibility_summary?: string;
          application_instructions?: string;
          application_open_date?: string | null;
          student_deadline_at?: string | null;
          institute_verification_deadline_at?: string | null;
          state_nodal_deadline_at?: string | null;
          is_deadline_verified?: boolean;
          fresh_applications_open?: boolean;
          renewal_applications_open?: boolean;
          official_source_url?: string;
          official_application_url?: string;
          verification_status?: VerificationStatus;
          last_verified_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          search_vector?: string | null;
        };
        Relationships: [];
      };
      scholarship_eligibility_rules: {
        Row: {
          id: string;
          scholarship_id: string;
          version: number;
          allowed_education_levels: EducationLevel[];
          max_income_inr: number | null;
          allowed_states: string[] | null;
          allowed_courses: string[] | null;
          rule_ast: Json;
          eligibility_source_citation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          scholarship_id: string;
          version?: number;
          allowed_education_levels: EducationLevel[];
          max_income_inr?: number | null;
          allowed_states?: string[] | null;
          allowed_courses?: string[] | null;
          rule_ast: Json;
          eligibility_source_citation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          scholarship_id?: string;
          version?: number;
          allowed_education_levels?: EducationLevel[];
          max_income_inr?: number | null;
          allowed_states?: string[] | null;
          allowed_courses?: string[] | null;
          rule_ast?: Json;
          eligibility_source_citation?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scholarship_eligibility_rules_scholarship_id_fkey";
            columns: ["scholarship_id"];
            isOneToOne: false;
            referencedRelation: "scholarships";
            referencedColumns: ["id"];
          },
        ];
      };
      scholarship_documents: {
        Row: {
          id: string;
          scholarship_id: string;
          document_name: string;
          specification_notes: string;
          is_mandatory: boolean;
          issuing_authority: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          scholarship_id: string;
          document_name: string;
          specification_notes: string;
          is_mandatory?: boolean;
          issuing_authority?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          scholarship_id?: string;
          document_name?: string;
          specification_notes?: string;
          is_mandatory?: boolean;
          issuing_authority?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "scholarship_documents_scholarship_id_fkey";
            columns: ["scholarship_id"];
            isOneToOne: false;
            referencedRelation: "scholarships";
            referencedColumns: ["id"];
          },
        ];
      };
      scholarship_sources: {
        Row: {
          id: string;
          scholarship_id: string;
          source_title: string;
          source_url: string;
          guideline_pdf_url: string | null;
          is_primary_government_portal: boolean;
          last_checked_at: string;
        };
        Insert: {
          id?: string;
          scholarship_id: string;
          source_title: string;
          source_url: string;
          guideline_pdf_url?: string | null;
          is_primary_government_portal?: boolean;
          last_checked_at?: string;
        };
        Update: {
          id?: string;
          scholarship_id?: string;
          source_title?: string;
          source_url?: string;
          guideline_pdf_url?: string | null;
          is_primary_government_portal?: boolean;
          last_checked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scholarship_sources_scholarship_id_fkey";
            columns: ["scholarship_id"];
            isOneToOne: false;
            referencedRelation: "scholarships";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_scholarships: {
        Row: {
          id: string;
          user_id: string;
          scholarship_id: string;
          match_status_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scholarship_id: string;
          match_status_snapshot?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scholarship_id?: string;
          match_status_snapshot?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          scholarship_id: string;
          status: ApplicationStatus;
          application_reference_id: string | null;
          private_notes: string | null;
          submitted_at: string | null;
          target_submission_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scholarship_id: string;
          status?: ApplicationStatus;
          application_reference_id?: string | null;
          private_notes?: string | null;
          submitted_at?: string | null;
          target_submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scholarship_id?: string;
          status?: ApplicationStatus;
          application_reference_id?: string | null;
          private_notes?: string | null;
          submitted_at?: string | null;
          target_submission_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_checklists: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          user_id: string;
          item_title: string;
          item_category: "document" | "registration" | "verification" | "test";
          guidance_notes: string | null;
          is_completed: boolean;
          completed_at: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          user_id: string;
          item_title: string;
          item_category: "document" | "registration" | "verification" | "test";
          guidance_notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          checklist_id?: string;
          user_id?: string;
          item_title?: string;
          item_category?: "document" | "registration" | "verification" | "test";
          guidance_notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          scholarship_id: string;
          remind_at: string;
          reminder_label: string;
          is_dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          scholarship_id: string;
          remind_at: string;
          reminder_label: string;
          is_dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          scholarship_id?: string;
          remind_at?: string;
          reminder_label?: string;
          is_dismissed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_logs: {
        Row: {
          id: string;
          scholarship_id: string;
          admin_user_id: string;
          previous_status: VerificationStatus | null;
          new_status: VerificationStatus;
          verified_source_url: string;
          change_summary: string;
          verified_at: string;
        };
        Insert: {
          id?: string;
          scholarship_id: string;
          admin_user_id: string;
          previous_status?: VerificationStatus | null;
          new_status: VerificationStatus;
          verified_source_url: string;
          change_summary: string;
          verified_at?: string;
        };
        Update: {
          id?: string;
          scholarship_id?: string;
          admin_user_id?: string;
          previous_status?: VerificationStatus | null;
          new_status?: VerificationStatus;
          verified_source_url?: string;
          change_summary?: string;
          verified_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      verification_logs_public: {
        Row: {
          id: string;
          scholarship_id: string;
          previous_status: VerificationStatus | null;
          new_status: VerificationStatus;
          verified_source_url: string;
          change_summary: string;
          verified_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_allowed_scholarship_url: {
        Args: {
          url: string;
        };
        Returns: boolean;
      };
      initialize_application_with_checklist: {
        Args: {
          p_user_id: string;
          p_scholarship_id: string;
        };
        Returns: {
          application_id: string;
          checklist_id: string;
          status: ApplicationStatus;
          new_items_created: number;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      education_level: EducationLevel;
      institution_type: InstitutionType;
      provider_type: ProviderType;
      funding_classification: FundingClassification;
      verification_status: VerificationStatus;
      application_status: ApplicationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
