/**
 * Generates an RFC 5545 compliant iCalendar (.ics) file from scholarship deadlines.
 * Operates client-side with zero PII.
 */

export interface CalendarEventInput {
  id: string;
  name: string;
  provider: string;
  deadlineIso: string;
  type: "student" | "institute" | "state_nodal";
  url: string;
}

function formatDateToICS(isoString: string): string {
  const date = new Date(isoString);
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function generateDeadlinesICS(events: CalendarEventInput[]): string {
  const now = formatDateToICS(new Date().toISOString());

  const vEvents = events
    .map((e) => {
      const typeLabel =
        e.type === "student"
          ? "Student Application Deadline"
          : e.type === "institute"
            ? "Institute Verification (INO) Deadline"
            : "State Nodal Officer (SNO) Deadline";

      const dt = formatDateToICS(e.deadlineIso);

      return [
        "BEGIN:VEVENT",
        `UID:scholarbridge-${e.id}-${e.type}@scholarbridge.in`,
        `DTSTAMP:${now}`,
        `DTSTART:${dt}`,
        `DTEND:${dt}`,
        `SUMMARY:[ScholarBridge] ${e.name} (${typeLabel})`,
        `DESCRIPTION:${typeLabel} for ${e.name} by ${e.provider}. Official Portal: ${e.url}`,
        `URL:${e.url}`,
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarBridge//Indian Student Scholarship Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ScholarBridge Scholarship Deadlines",
    "X-WR-TIMEZONE:Asia/Kolkata",
    vEvents,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICSFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
