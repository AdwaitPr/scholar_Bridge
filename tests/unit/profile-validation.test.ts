import { describe, it, expect } from "vitest";
import { StudentProfileSchema } from "@/lib/schemas/profile.schema";

describe("Phase 5: Student Profile Schema & Strict Data Minimization (P5-T3)", () => {
  const validBaseProfile = {
    display_name: "Aadya Sharma",
    education_level: "undergraduate_technical" as const,
    course_stream: "B.Tech Computer Science",
    course_year: 1,
    is_lateral_entry: false,
    study_mode: "regular_full_time" as const,
    domicile_state: "Maharashtra",
    institution_type: "aicte_approved" as const,
    has_valid_aishe_code: true,
    academic_percentage: 84.5,
    annual_family_income_inr: 450000,
    social_category: "General" as const,
    gender: "Female" as const,
  };

  it("validates a compliant student profile successfully", () => {
    const result = StudentProfileSchema.safeParse(validBaseProfile);
    expect(result.success).toBe(true);
  });

  it("strictly rejects unexpected Aadhaar number key", () => {
    const payloadWithAadhaar = {
      ...validBaseProfile,
      aadhaar: "1234-5678-9012",
    };
    const result = StudentProfileSchema.safeParse(payloadWithAadhaar);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue).toBeDefined();
      expect(issue?.message).toMatch(/unrecognized/i);
    }
  });

  it("strictly rejects bank account and IFSC details", () => {
    const payloadWithBank = {
      ...validBaseProfile,
      bank_account_number: "9876543210123",
      ifsc_code: "SBIN0001234",
    };
    const result = StudentProfileSchema.safeParse(payloadWithBank);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /unrecognized/i.test(m))).toBe(true);
    }
  });

  it("strictly rejects PAN and parent names", () => {
    const payloadWithPan = {
      ...validBaseProfile,
      pan_number: "ABCDE1234F",
      father_name: "Ramesh Sharma",
    };
    const result = StudentProfileSchema.safeParse(payloadWithPan);
    expect(result.success).toBe(false);
  });

  it("strictly validates boundary conditions on academic percentages", () => {
    const invalidPercentage = {
      ...validBaseProfile,
      academic_percentage: 105.0,
    };
    const result = StudentProfileSchema.safeParse(invalidPercentage);
    expect(result.success).toBe(false);
  });

  it("strictly validates negative income rejection", () => {
    const negativeIncome = {
      ...validBaseProfile,
      annual_family_income_inr: -50000,
    };
    const result = StudentProfileSchema.safeParse(negativeIncome);
    expect(result.success).toBe(false);
  });

  it("strictly validates course year bounds [1, 6]", () => {
    const invalidYear = {
      ...validBaseProfile,
      course_year: 8,
    };
    const result = StudentProfileSchema.safeParse(invalidYear);
    expect(result.success).toBe(false);
  });
});
