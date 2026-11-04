import { describe, it, expect } from "vitest";
import scholarshipsSeed from "../../supabase/seed/scholarships.json";
import testUsersSeed from "../../supabase/seed/test-users.json";

describe("Seed Data Verification & Integrity", () => {
  it("contains exactly 16 verified scholarships (including SCH-15A/15B split per D15)", () => {
    expect(scholarshipsSeed).toHaveLength(16);

    const codes = scholarshipsSeed.map((s) => s.code);
    expect(codes).toContain("SCH-01");
    expect(codes).toContain("SCH-05");
    expect(codes).toContain("SCH-07");
    expect(codes).toContain("SCH-15A");
    expect(codes).toContain("SCH-15B");
  });

  it("all scholarships have unique codes and slugs", () => {
    const codes = scholarshipsSeed.map((s) => s.code);
    const slugs = scholarshipsSeed.map((s) => s.slug);

    expect(new Set(codes).size).toBe(16);
    expect(new Set(slugs).size).toBe(16);
  });

  it("enforces https and host allowlist for all official URLs (D10)", () => {
    const allowlistRegex =
      /^https:\/\/([a-zA-Z0-9.-]+\.(gov\.in|nic\.in|ac\.in)|scholarships\.reliancefoundation\.org)(\/.*)?$/;

    for (const sch of scholarshipsSeed) {
      expect(sch.official_source_url).toMatch(allowlistRegex);
      expect(sch.official_application_url).toMatch(allowlistRegex);

      if (sch.sources) {
        for (const src of sch.sources) {
          expect(src.source_url).toMatch(allowlistRegex);
        }
      }
    }
  });

  it("ensures max_income_inr column matches AST condition value (D13)", () => {
    for (const sch of scholarshipsSeed) {
      const ast = sch.rule_ast;
      const incomeCondition = findConditionByField(
        ast,
        "annual_family_income_inr"
      );

      if (incomeCondition) {
        expect(sch.max_income_inr).toBe(incomeCondition.value);
      } else {
        expect(sch.max_income_inr).toBeNull();
      }
    }
  });

  it("contains synthetic test users for student A, student B, and curator admin (P1-T7)", () => {
    expect(testUsersSeed).toHaveLength(3);
    const admin = testUsersSeed.find((u) => u.role === "admin");
    const student = testUsersSeed.find((u) => u.role === "student");

    expect(admin).toBeDefined();
    expect(student).toBeDefined();
  });
});

interface ASTNode {
  type: string;
  field?: string;
  value?: unknown;
  children?: ASTNode[];
}

function findConditionByField(node: ASTNode, field: string): ASTNode | null {
  if (node.type === "CONDITION") {
    return node.field === field ? node : null;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findConditionByField(child, field);
      if (found) return found;
    }
  }
  return null;
}
