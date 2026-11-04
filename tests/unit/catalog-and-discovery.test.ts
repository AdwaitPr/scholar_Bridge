import { describe, it, expect } from "vitest";
import { ScholarshipCatalogRepository } from "@/modules/scholarship-catalog/repository";

describe("Phase 4: Scholarship Catalog Repository & Discovery", () => {
  it("lists all seeded scholarships by default", async () => {
    const result = await ScholarshipCatalogRepository.list({
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBe(16);
    expect(result.items.length).toBe(16);
  });

  it("filters correctly by education level", async () => {
    const result = await ScholarshipCatalogRepository.list({
      education_level: "undergraduate_technical",
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBeGreaterThan(0);
    for (const item of result.items) {
      const allowedLevels =
        item.scholarship_eligibility_rules?.[0]?.allowed_education_levels || [];
      expect(allowedLevels).toContain("undergraduate_technical");
    }
  });

  it("filters correctly by funding type", async () => {
    const result = await ScholarshipCatalogRepository.list({
      funding_type: "merit_based",
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.funding_type).toBe("merit_based");
    }
  });

  it("filters correctly by provider type", async () => {
    const result = await ScholarshipCatalogRepository.list({
      provider_type: "private_foundation",
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBe(2); // Reliance UG and Reliance PG
    for (const item of result.items) {
      expect(item.provider_type).toBe("private_foundation");
    }
  });

  it("filters by max income threshold", async () => {
    const result = await ScholarshipCatalogRepository.list({
      max_income: 250000,
      page: 1,
      page_size: 20,
    });
    expect(result.total).toBeGreaterThan(0);
    for (const item of result.items) {
      const rule = item.scholarship_eligibility_rules?.[0];
      if (rule?.max_income_inr !== null && rule?.max_income_inr !== undefined) {
        expect(rule.max_income_inr).toBeGreaterThanOrEqual(250000);
      }
    }
  });

  it("searches scholarships by keyword in name or provider", async () => {
    const pragatiResult = await ScholarshipCatalogRepository.list({
      q: "Pragati",
    });
    expect(pragatiResult.total).toBeGreaterThanOrEqual(1);
    expect(pragatiResult.items[0]?.name).toContain("Pragati");

    const relianceResult = await ScholarshipCatalogRepository.list({
      q: "Reliance",
    });
    expect(relianceResult.total).toBe(2);
    expect(relianceResult.items[0]?.provider_name).toContain("Reliance");
  });

  it("paginates properly with page and page_size", async () => {
    const page1 = await ScholarshipCatalogRepository.list({
      page: 1,
      page_size: 5,
    });
    expect(page1.items.length).toBe(5);
    expect(page1.total).toBe(16);

    const page2 = await ScholarshipCatalogRepository.list({
      page: 2,
      page_size: 5,
    });
    expect(page2.items.length).toBe(5);
    expect(page2.items[0]?.slug).not.toBe(page1.items[0]?.slug);
  });

  it("retrieves a scholarship by slug with hydrated rules and documents", async () => {
    const scholarship = await ScholarshipCatalogRepository.getBySlug(
      "aicte-pragati-degree"
    );
    expect(scholarship).not.toBeNull();
    expect(scholarship?.code).toBe("SCH-01");
    expect(scholarship?.name).toContain("AICTE Pragati");
    expect(scholarship?.scholarship_eligibility_rules).toBeDefined();
    expect(scholarship?.scholarship_eligibility_rules?.length).toBeGreaterThan(
      0
    );
    expect(scholarship?.scholarship_documents).toBeDefined();
    expect(scholarship?.scholarship_documents?.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent slug", async () => {
    const scholarship =
      await ScholarshipCatalogRepository.getBySlug("non-existent-slug");
    expect(scholarship).toBeNull();
  });
});
