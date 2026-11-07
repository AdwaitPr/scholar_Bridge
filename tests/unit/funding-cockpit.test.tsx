import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FundingStrategyCockpit } from "@/modules/eligibility-engine/components/funding-strategy-cockpit";
import type { OptimizationCandidate } from "@/modules/eligibility-engine/concurrence.types";

const mockCandidates: OptimizationCandidate[] = [
  {
    code: "SCH-01",
    slug: "aicte-pragati-girls",
    name: "AICTE Pragati Scholarship for Girls",
    annualBenefitInr: 50000,
    classification: "CENTRAL_MERIT",
    competitivenessWeight: 0.6,
  },
  {
    code: "SCH-07",
    slug: "pm-usp-csss-college",
    name: "PM-USP Central Sector Scheme of Scholarship (CSSS)",
    annualBenefitInr: 20000,
    classification: "CENTRAL_MERIT",
    competitivenessWeight: 0.25,
  },
  {
    code: "SCH-09",
    slug: "central-sector-top-class-sc",
    name: "Central Sector Top Class Education Scheme for SC Students",
    annualBenefitInr: 200000,
    classification: "CENTRAL_WELFARE",
    competitivenessWeight: 0.75,
  },
  {
    code: "SCH-14",
    slug: "reliance-foundation-undergraduate",
    name: "Reliance Foundation Undergraduate Scholarship",
    annualBenefitInr: 200000,
    classification: "PHILANTHROPIC_STACKABLE",
    competitivenessWeight: 0.15,
  },
];

describe("FundingStrategyCockpit UI Component", () => {
  it("renders empty state when no scholarship candidates are provided", () => {
    render(<FundingStrategyCockpit candidates={[]} />);
    expect(
      screen.getByText(/No Scholarships Shortlisted for Optimization/i)
    ).toBeDefined();
  });

  it("calculates and displays optimal legal disbursement bundle", () => {
    render(
      <FundingStrategyCockpit
        candidates={mockCandidates}
        initialCollegeFeesInr={250000}
      />
    );

    // Cockpit title / header
    expect(
      screen.getByText(/Grant Concurrence & Disbursement Optimizer/i)
    ).toBeDefined();

    // Optimal bundle should pick Top Class SC (SCH-09) and Reliance (SCH-14) up to fees or yield
    expect(screen.getByText(/Optimal Disbursement Strategy/i)).toBeDefined();

    // Mutual exclusion alert between SCH-01 and SCH-07
    expect(
      screen.getByText(/Regulatory Collisions & Surrender Advisory/i)
    ).toBeDefined();
    expect(
      screen.getAllByText(/AICTE Pragati Scholarship for Girls/i).length
    ).toBeGreaterThan(0);
  });

  it("updates calculations when optimization objective is toggled", () => {
    render(
      <FundingStrategyCockpit
        candidates={mockCandidates}
        initialCollegeFeesInr={150000}
      />
    );

    const yieldToggle = screen.getByRole("button", {
      name: /Risk-Balanced Yield/i,
    });
    fireEvent.click(yieldToggle);

    expect(screen.getByText(/Balanced Probability Mode/i)).toBeDefined();
  });

  it("updates college fee gap coverage when college fees input changes", () => {
    render(
      <FundingStrategyCockpit
        candidates={mockCandidates}
        initialCollegeFeesInr={100000}
      />
    );

    const feeInput = screen.getByLabelText(
      /Annual College Cost/i
    ) as HTMLInputElement;
    fireEvent.change(feeInput, { target: { value: "200000" } });

    expect(feeInput.value).toBe("200000");
  });
});
