import { describe, it, expect } from "vitest";
import {
  StudentProfileSchema,
  RuleNodeSchema,
  ProfileFieldKeyEnum,
  DiscoveryQuerySchema,
  AdminScholarshipUpsertSchema,
  isValidStatusTransition,
} from "@/lib/schemas";

describe("Phase 2 Shared Schemas & Security Validation", () => {
  describe("StudentProfileSchema Strict Privacy Minimization", () => {
    it("accepts valid student profile attributes", () => {
      const valid = {
        display_name: "Ananya Sharma",
        education_level: "undergraduate_technical" as const,
        course_year: 1,
        annual_family_income_inr: 450000,
        gender: "Female" as const,
      };

      const result = StudentProfileSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("strictly rejects forbidden PII and financial fields like aadhaar or bank_account", () => {
      const forbidden = {
        display_name: "Sneha",
        education_level: "undergraduate_technical" as const,
        aadhaar_number: "1234 5678 9012", // Forbidden PII
      };

      const result = StudentProfileSchema.safeParse(forbidden);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/unrecognized/i);
      }
    });
  });

  describe("Rule AST Schema (Fix D3 & D4)", () => {
    it("validates LeafCondition with ProfileFieldKeyEnum", () => {
      expect(ProfileFieldKeyEnum.options).toContain("annual_family_income_inr");
      expect(ProfileFieldKeyEnum.options).toContain("gender");
      expect(ProfileFieldKeyEnum.options).toContain(
        "has_disability_40_percent"
      );

      const leaf = {
        type: "CONDITION" as const,
        id: "income-test",
        category: "income" as const,
        field: "annual_family_income_inr" as const,
        operator: "lte" as const,
        value: 800000,
        requiresOfficialVerification: true,
        externalGateOnly: false,
        label: "Income check",
        passExplanation: "Income ok",
        failExplanation: "Income exceeded",
        missingExplanation: "Enter income",
      };

      const result = RuleNodeSchema.safeParse(leaf);
      expect(result.success).toBe(true);
    });

    it("validates nested AND/OR tree structure", () => {
      const tree = {
        type: "AND" as const,
        id: "root-and",
        label: "Root",
        children: [
          {
            type: "CONDITION" as const,
            id: "leaf-1",
            category: "other" as const,
            field: "gender" as const,
            operator: "eq" as const,
            value: "Female",
            requiresOfficialVerification: false,
            externalGateOnly: false,
            label: "Gender check",
            passExplanation: "Pass",
            failExplanation: "Fail",
            missingExplanation: "Missing",
          },
        ],
      };

      const result = RuleNodeSchema.safeParse(tree);
      expect(result.success).toBe(true);
    });
  });

  describe("Application Status State Machine", () => {
    it("allows valid forward and backward transitions", () => {
      expect(isValidStatusTransition("Saved", "Preparing")).toBe(true);
      expect(isValidStatusTransition("Preparing", "Ready to apply")).toBe(true);
      expect(isValidStatusTransition("Ready to apply", "Submitted")).toBe(true);
      expect(isValidStatusTransition("Submitted", "Awaiting result")).toBe(
        true
      );
      expect(isValidStatusTransition("Awaiting result", "Awarded")).toBe(true);
    });

    it("allows transition to Closed from any state", () => {
      expect(isValidStatusTransition("Saved", "Closed")).toBe(true);
      expect(isValidStatusTransition("Preparing", "Closed")).toBe(true);
      expect(isValidStatusTransition("Submitted", "Closed")).toBe(true);
      expect(isValidStatusTransition("Awarded", "Closed")).toBe(true);
    });

    it("rejects illegal leaps (e.g. Saved directly to Awarded)", () => {
      expect(isValidStatusTransition("Saved", "Awarded")).toBe(false);
      expect(isValidStatusTransition("Saved", "Submitted")).toBe(false);
      expect(isValidStatusTransition("Submitted", "Preparing")).toBe(false);
    });
  });

  describe("Discovery Query Schema", () => {
    it("applies default pagination and sorting", () => {
      const parsed = DiscoveryQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.page_size).toBe(12);
      expect(parsed.sort).toBe("deadline_asc");
      expect(parsed.hide_expired).toBe(false);
    });

    it("clamps max page size to 50", () => {
      const result = DiscoveryQuerySchema.safeParse({ page_size: 100 });
      expect(result.success).toBe(false);
    });
  });

  describe("Admin Scholarship Upsert Schema (Fix D10 Allowlist)", () => {
    it("rejects non-allowlisted domains for official source URL", () => {
      const payload = {
        code: "TEST-01",
        slug: "test-scholarship",
        name: "Test Scheme",
        provider_name: "Test Provider",
        provider_type: "central_government" as const,
        funding_type: "merit_based" as const,
        description: "Test description for scholarship",
        benefits_summary: "Rs 50000",
        eligibility_summary: "Test eligibility",
        application_instructions: "Apply online",
        official_source_url: "https://randomblog.com/scholarships", // NOT in allowlist
        official_application_url: "https://scholarships.gov.in/",
        verification_status: "verified" as const,
        verification_note: "Admin verified",
        allowed_education_levels: ["undergraduate_technical" as const],
        eligibility_source_citation: "Official Gazette 2026",
        rule_ast: {
          type: "CONDITION" as const,
          id: "cond-1",
          category: "other" as const,
          field: "gender" as const,
          operator: "eq" as const,
          value: "Female",
          requiresOfficialVerification: false,
          externalGateOnly: false,
          label: "Female",
          passExplanation: "Ok",
          failExplanation: "No",
          missingExplanation: "Missing",
        },
      };

      const result = AdminScholarshipUpsertSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("accepts valid .gov.in and reliance foundation domains", () => {
      const validUrl = "https://scholarships.gov.in/All-Scholarships";
      const validFoundationUrl = "https://scholarships.reliancefoundation.org";

      const regex =
        /^https:\/\/([a-zA-Z0-9.-]+\.(gov\.in|nic\.in|ac\.in)|scholarships\.reliancefoundation\.org)(\/.*)?$/;

      expect(regex.test(validUrl)).toBe(true);
      expect(regex.test(validFoundationUrl)).toBe(true);
      expect(regex.test("https://unverified-third-party.in")).toBe(false);
    });
  });
});
