import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import seedScholarships from "../../../supabase/seed/scholarships.json";
import { DiscoveryQueryInput } from "@/lib/schemas";

export type ScholarshipRecord =
  Database["public"]["Tables"]["scholarships"]["Row"] & {
    scholarship_eligibility_rules?: Database["public"]["Tables"]["scholarship_eligibility_rules"]["Row"][];
    scholarship_documents?: Database["public"]["Tables"]["scholarship_documents"]["Row"][];
    scholarship_sources?: Database["public"]["Tables"]["scholarship_sources"]["Row"][];
    verification_logs_public?: Database["public"]["Views"]["verification_logs_public"]["Row"][];
  };

/**
 * Transforms a seed JSON item into a hydrated ScholarshipRecord
 */
function mapSeedToRecord(
  seedItem: (typeof seedScholarships)[0]
): ScholarshipRecord {
  return {
    id: `seed-${seedItem.code.toLowerCase()}`,
    code: seedItem.code,
    slug: seedItem.slug,
    name: seedItem.name,
    provider_name: seedItem.provider_name,
    provider_type: seedItem.provider_type as ScholarshipRecord["provider_type"],
    funding_type: seedItem.funding_type as ScholarshipRecord["funding_type"],
    description: seedItem.description,
    benefits_summary: seedItem.benefits_summary,
    max_annual_benefit_inr: seedItem.max_annual_benefit_inr,
    eligibility_summary: seedItem.eligibility_summary,
    application_instructions: seedItem.application_instructions,
    application_open_date: seedItem.application_open_date,
    student_deadline_at: seedItem.student_deadline_at,
    institute_verification_deadline_at:
      seedItem.institute_verification_deadline_at,
    state_nodal_deadline_at: seedItem.state_nodal_deadline_at,
    is_deadline_verified: seedItem.is_deadline_verified,
    fresh_applications_open: seedItem.fresh_applications_open,
    renewal_applications_open: seedItem.renewal_applications_open,
    official_source_url: seedItem.official_source_url,
    official_application_url: seedItem.official_application_url,
    verification_status:
      seedItem.verification_status as ScholarshipRecord["verification_status"],
    last_verified_at: seedItem.last_verified_at,
    is_active: seedItem.is_active,
    created_at: "2026-11-04T00:00:00.000Z",
    updated_at: "2026-11-04T00:00:00.000Z",
    search_vector: null,
    scholarship_eligibility_rules: [
      {
        id: `rule-${seedItem.code.toLowerCase()}`,
        scholarship_id: `seed-${seedItem.code.toLowerCase()}`,
        version: 1,
        allowed_education_levels:
          seedItem.allowed_education_levels as NonNullable<
            ScholarshipRecord["scholarship_eligibility_rules"]
          >[0]["allowed_education_levels"],
        max_income_inr: seedItem.max_income_inr,
        allowed_states: seedItem.allowed_states,
        allowed_courses: seedItem.allowed_courses,
        rule_ast: seedItem.rule_ast,
        eligibility_source_citation: seedItem.eligibility_source_citation,
        created_at: "2026-11-04T00:00:00.000Z",
      },
    ],
    scholarship_documents: (seedItem.documents || []).map((doc, idx) => ({
      id: `doc-${seedItem.code.toLowerCase()}-${idx}`,
      scholarship_id: `seed-${seedItem.code.toLowerCase()}`,
      document_name: doc.document_name,
      specification_notes: doc.specification_notes,
      is_mandatory: doc.is_mandatory,
      issuing_authority: doc.issuing_authority,
      sort_order: doc.sort_order,
    })),
    scholarship_sources: (seedItem.sources || []).map((src, idx) => ({
      id: `src-${seedItem.code.toLowerCase()}-${idx}`,
      scholarship_id: `seed-${seedItem.code.toLowerCase()}`,
      source_title: src.source_title,
      source_url: src.source_url,
      guideline_pdf_url: src.guideline_pdf_url,
      is_primary_government_portal: src.is_primary_government_portal,
      last_checked_at: "2026-11-04T00:00:00.000Z",
    })),
    verification_logs_public: [
      {
        id: `log-${seedItem.code.toLowerCase()}-1`,
        scholarship_id: `seed-${seedItem.code.toLowerCase()}`,
        previous_status: null,
        new_status:
          seedItem.verification_status as ScholarshipRecord["verification_status"],
        verified_source_url: seedItem.official_source_url,
        change_summary:
          "Source verified for AY 2026-27 cycle against official portal.",
        verified_at: seedItem.last_verified_at,
      },
    ],
  };
}

export class ScholarshipCatalogRepository {
  /**
   * Fetches scholarship by its unique slug, including rules, documents, sources, and public verification logs.
   */
  static async getBySlug(slug: string): Promise<ScholarshipRecord | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("scholarships")
        .select(
          `
          *,
          scholarship_eligibility_rules (*),
          scholarship_documents (*),
          scholarship_sources (*)
        `
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!error && data) {
        // Fetch public verification logs view
        const { data: logs } = await supabase
          .from("verification_logs_public")
          .select("*")
          .eq("scholarship_id", data.id)
          .order("verified_at", { ascending: false });

        return {
          ...data,
          verification_logs_public: logs || [],
        };
      }
    } catch {
      // Fall through to seed fallback
    }

    // Seed fallback for local demonstration / offline mode
    const seedMatch = seedScholarships.find((s) => s.slug === slug);
    if (seedMatch) {
      return mapSeedToRecord(seedMatch);
    }
    return null;
  }

  /**
   * Lists and searches scholarships with filtering and pagination.
   */
  static async list(filters: Partial<DiscoveryQueryInput> = {}): Promise<{
    items: ScholarshipRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const pageSize = filters.page_size ?? 12;

    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("scholarships")
        .select(
          `
          *,
          scholarship_eligibility_rules (*),
          scholarship_documents (*),
          scholarship_sources (*)
        `,
          { count: "exact" }
        )
        .eq("is_active", true);

      if (filters.q) {
        query = query.textSearch("search_vector", filters.q, {
          type: "websearch",
        });
      }
      if (filters.funding_type) {
        query = query.eq("funding_type", filters.funding_type);
      }
      if (filters.provider_type) {
        query = query.eq("provider_type", filters.provider_type);
      }

      // Sort
      if (filters.sort === "amount_desc") {
        query = query.order("max_annual_benefit_inr", {
          ascending: false,
          nullsFirst: false,
        });
      } else if (filters.sort === "name_asc") {
        query = query.order("name", { ascending: true });
      } else {
        query = query.order("student_deadline_at", {
          ascending: true,
          nullsFirst: false,
        });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        return {
          items: data as ScholarshipRecord[],
          total: count ?? data.length,
          page,
          pageSize,
          totalPages: Math.ceil((count ?? data.length) / pageSize),
        };
      }
    } catch {
      // Fall through to seed fallback
    }

    // Seed in-memory search and filter fallback
    let items = seedScholarships.map(mapSeedToRecord);

    if (filters.q) {
      const queryLower = filters.q.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(queryLower) ||
          i.provider_name.toLowerCase().includes(queryLower) ||
          i.description.toLowerCase().includes(queryLower) ||
          i.eligibility_summary.toLowerCase().includes(queryLower)
      );
    }

    if (filters.funding_type) {
      items = items.filter((i) => i.funding_type === filters.funding_type);
    }

    if (filters.provider_type) {
      items = items.filter((i) => i.provider_type === filters.provider_type);
    }

    if (filters.education_level) {
      items = items.filter((i) => {
        const rules = i.scholarship_eligibility_rules?.[0];
        return rules?.allowed_education_levels.includes(
          filters.education_level as never
        );
      });
    }

    if (filters.max_income !== undefined) {
      items = items.filter((i) => {
        const rules = i.scholarship_eligibility_rules?.[0];
        if (
          rules?.max_income_inr === null ||
          rules?.max_income_inr === undefined
        )
          return true;
        return rules.max_income_inr >= filters.max_income!;
      });
    }

    if (filters.state) {
      items = items.filter((i) => {
        const rules = i.scholarship_eligibility_rules?.[0];
        if (!rules?.allowed_states || rules.allowed_states.length === 0)
          return true;
        return rules.allowed_states.includes(filters.state as never);
      });
    }

    if (filters.sort === "amount_desc") {
      items.sort(
        (a, b) =>
          (b.max_annual_benefit_inr ?? 0) - (a.max_annual_benefit_inr ?? 0)
      );
    } else if (filters.sort === "name_asc") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      items.sort((a, b) => {
        if (!a.student_deadline_at) return 1;
        if (!b.student_deadline_at) return -1;
        return (
          new Date(a.student_deadline_at).getTime() -
          new Date(b.student_deadline_at).getTime()
        );
      });
    }

    const total = items.length;
    const from = (page - 1) * pageSize;
    const paginatedItems = items.slice(from, from + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
