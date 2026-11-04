import { describe, it, expect } from "vitest";
import { AdminScholarshipUpsertSchema } from "@/lib/schemas/admin.schema";

describe("Phase 7: Admin Console Validation & Security Boundaries", () => {
  const validPayload = {
    code: "TEST-SCH-01",
    slug: "test-scholarship-01",
    name: "National Test Scholarship for Engineering",
    provider_name: "Ministry of Education",
    provider_type: "central_government" as const,
    funding_type: "merit_cum_means" as const,
    description: "Verified scholarship for engineering students across India.",
    benefits_summary: "₹50,000 per annum towards academic fee.",
    max_annual_benefit_inr: 50000,
    eligibility_summary: "Family income under 8 LPA, AICTE approved degree.",
    application_instructions: "Apply via National Scholarship Portal OTR.",
    application_open_date: "2026-07-01",
    student_deadline_at: "2026-11-30T18:29:59.000Z",
    institute_verification_deadline_at: "2026-12-15T18:29:59.000Z",
    is_deadline_verified: true,
    fresh_applications_open: true,
    renewal_applications_open: true,
    official_source_url: "https://scholarships.gov.in/All-Scholarships",
    official_application_url: "https://scholarships.gov.in",
    verification_status: "verified" as const,
    verification_note: "Verified against live NSP circular 2026-27.",
    is_active: true,
    allowed_education_levels: ["undergraduate_technical" as const],
    max_income_inr: 800000,
    allowed_states: null,
    allowed_courses: ["B.Tech", "B.E."],
    rule_ast: {
      type: "AND" as const,
      id: "root",
      label: "All Mandatory Rules",
      children: [
        {
          type: "CONDITION" as const,
          id: "c1",
          category: "income" as const,
          field: "annual_family_income_inr" as const,
          operator: "lte" as const,
          value: 800000,
          requiresOfficialVerification: false,
          externalGateOnly: false,
          label: "Income Limit",
          passExplanation: "Income <= 8L",
          failExplanation: "Income > 8L",
          missingExplanation: "Income missing",
        },
      ],
    },
    eligibility_source_citation: "NSP Guidelines Clause 4.2",
    documents: [
      {
        document_name: "Income Certificate",
        specification_notes:
          "Issued by competent revenue authority (Tehsildar/SDM).",
        is_mandatory: true,
        issuing_authority: "State Revenue Department",
        sort_order: 1,
      },
    ],
    sources: [
      {
        source_title: "NSP Official Scheme Portal",
        source_url: "https://scholarships.gov.in/All-Scholarships",
        is_primary_government_portal: true,
      },
    ],
  };

  it("accepts a completely valid admin upsert payload with allowlisted government URLs", () => {
    const result = AdminScholarshipUpsertSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects unallowlisted third-party aggregator URLs (Fix D10)", () => {
    const invalidUrlPayload = {
      ...validPayload,
      official_source_url: "https://buddy4study.com/scholarships/aicte",
    };
    const result = AdminScholarshipUpsertSchema.safeParse(invalidUrlPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Official source URL must be https and from .gov.in"
      );
    }
  });

  it("rejects non-https URLs even if domain matches government format", () => {
    const httpPayload = {
      ...validPayload,
      official_application_url: "http://scholarships.gov.in",
    };
    const result = AdminScholarshipUpsertSchema.safeParse(httpPayload);
    expect(result.success).toBe(false);
  });

  it("allows verified philanthropic partner domain scholarships.reliancefoundation.org", () => {
    const reliancePayload = {
      ...validPayload,
      code: "SCH-14",
      slug: "reliance-foundation-ug",
      official_source_url: "https://scholarships.reliancefoundation.org",
      official_application_url:
        "https://scholarships.reliancefoundation.org/Application.aspx",
    };
    const result = AdminScholarshipUpsertSchema.safeParse(reliancePayload);
    expect(result.success).toBe(true);
  });

  it("allows academic domains under .ac.in (e.g. ugc.ac.in, iisc.ac.in)", () => {
    const acInPayload = {
      ...validPayload,
      official_source_url: "https://ugc.ac.in/schemes",
      official_application_url: "https://scholarships.gov.in",
    };
    const result = AdminScholarshipUpsertSchema.safeParse(acInPayload);
    expect(result.success).toBe(true);
  });

  it("requires a verification audit note when updating scholarship (Fix P7-T7)", () => {
    const missingAuditNote = {
      ...validPayload,
      verification_note: "",
    };
    const result = AdminScholarshipUpsertSchema.safeParse(missingAuditNote);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("verification_note");
    }
  });
});
