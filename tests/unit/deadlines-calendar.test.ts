import { describe, it, expect } from "vitest";
import { generateDeadlinesICS } from "@/modules/deadline-management/ics-generator";
import { formatInIST } from "@/modules/deadline-management/deadline.service";

describe("Phase 6: Deadline Calendar & ICS Export (P6-T7)", () => {
  it("generates RFC 5545 compliant iCalendar string without PII", () => {
    const events = [
      {
        id: "SCH-01",
        name: "AICTE Pragati Scholarship for Girls",
        provider: "AICTE",
        deadlineIso: "2026-11-30T18:29:59.000Z",
        type: "student" as const,
        url: "https://scholarships.gov.in",
      },
      {
        id: "SCH-01",
        name: "AICTE Pragati Scholarship for Girls",
        provider: "AICTE",
        deadlineIso: "2026-12-15T18:29:59.000Z",
        type: "institute" as const,
        url: "https://scholarships.gov.in",
      },
    ];

    const ics = generateDeadlinesICS(events);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("X-WR-TIMEZONE:Asia/Kolkata");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain(
      "AICTE Pragati Scholarship for Girls (Student Application Deadline)"
    );
    expect(ics).toContain(
      "AICTE Pragati Scholarship for Girls (Institute Verification (INO) Deadline)"
    );
    expect(ics).toContain("END:VCALENDAR");

    // Zero PII check
    expect(ics).not.toMatch(/\b(aadhaar|bank|ifsc|pan)\b/i);
  });

  it("formats dates in IST timezone regardless of system timezone", () => {
    const formatted = formatInIST("2026-11-30T18:29:59.000Z");
    // 18:29:59 UTC + 5:30 = 23:59:59 on Nov 30
    expect(formatted).toContain("30");
    expect(formatted).toContain("Nov");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/11:59/);
  });
});
