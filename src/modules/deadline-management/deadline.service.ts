export type DeadlineUrgency =
  | "UNVERIFIED"
  | "EXPIRED"
  | "CRITICAL_72H"
  | "URGENT_7D"
  | "UPCOMING_30D"
  | "OPEN_PLENTY_OF_TIME";

export interface EvaluatedDeadline {
  displayText: string;
  istFormattedDate: string | null;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  isExpired: boolean;
  urgency: DeadlineUrgency;
  instituteVerificationNote: string | null;
  stateNodalVerificationNote: string | null;
  renewalOnlyNote: string | null;
}

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a Date or ISO date string in Indian Standard Time (IST).
 */
export function formatInIST(dateIsoOrObj: string | Date): string {
  const date =
    typeof dateIsoOrObj === "string" ? new Date(dateIsoOrObj) : dateIsoOrObj;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Evaluates scholarship deadlines strictly in Indian Standard Time (Asia/Kolkata).
 *
 * Implements:
 * - 3-date model: student application, institute verification (INO), state/nodal verification (SNO/DNO)
 * - Exact boundary handling: <= 72 hours (CRITICAL_72H), <= 7 days (URGENT_7D), <= 30 days (UPCOMING_30D)
 * - Immediate expiry at diffMs <= 0
 * - Unverified deadline handling
 * - Renewal-only window notices (e.g. PM-USP CSSS)
 * - Timezone-agnostic IST formatting regardless of process.env.TZ
 */
export function evaluateScholarshipDeadline(
  studentDeadlineIso: string | null,
  isDeadlineVerified: boolean,
  instituteDeadlineIso?: string | null,
  stateNodalDeadlineIso?: string | null,
  options?: {
    referenceNow?: Date;
    isRenewalOnly?: boolean;
  }
): EvaluatedDeadline {
  const referenceNow = options?.referenceNow ?? new Date();
  const isRenewalOnly = options?.isRenewalOnly ?? false;

  const renewalOnlyNote = isRenewalOnly
    ? "Portal open for renewal applications only; fresh application window pending official notification."
    : null;

  if (!isDeadlineVerified || !studentDeadlineIso) {
    return {
      displayText: "Deadline not verified",
      istFormattedDate: null,
      daysRemaining: null,
      hoursRemaining: null,
      isExpired: false,
      urgency: "UNVERIFIED",
      instituteVerificationNote:
        "Check the official portal URL for the current academic session schedule.",
      stateNodalVerificationNote: null,
      renewalOnlyNote,
    };
  }

  const deadlineDate = new Date(studentDeadlineIso);
  const diffMs = deadlineDate.getTime() - referenceNow.getTime();

  // Pure IST formatter independent of machine local timezone
  const istDateFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const istTimeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const istFormattedDate = `${istDateFormatter.format(deadlineDate)}, ${istTimeFormatter.format(
    deadlineDate
  )} IST`;

  let instituteVerificationNote: string | null = null;
  if (instituteDeadlineIso) {
    const instDate = new Date(instituteDeadlineIso);
    instituteVerificationNote = `Institute / Defective Verification open until ${istDateFormatter.format(
      instDate
    )} IST`;
  }

  let stateNodalVerificationNote: string | null = null;
  if (stateNodalDeadlineIso) {
    const nodalDate = new Date(stateNodalDeadlineIso);
    stateNodalVerificationNote = `District / State Nodal Verification open until ${istDateFormatter.format(
      nodalDate
    )} IST`;
  }

  // Exact expiry check: if reference time is equal to or past deadline instant
  if (diffMs <= 0) {
    return {
      displayText: `Expired (${istFormattedDate})`,
      istFormattedDate,
      daysRemaining: 0,
      hoursRemaining: 0,
      isExpired: true,
      urgency: "EXPIRED",
      instituteVerificationNote,
      stateNodalVerificationNote,
      renewalOnlyNote,
    };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let urgency: DeadlineUrgency = "OPEN_PLENTY_OF_TIME";
  if (hoursRemaining <= 72) {
    urgency = "CRITICAL_72H";
  } else if (daysRemaining <= 7) {
    urgency = "URGENT_7D";
  } else if (daysRemaining <= 30) {
    urgency = "UPCOMING_30D";
  }

  return {
    displayText: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left (${istFormattedDate})`,
    istFormattedDate,
    daysRemaining,
    hoursRemaining,
    isExpired: false,
    urgency,
    instituteVerificationNote,
    stateNodalVerificationNote,
    renewalOnlyNote,
  };
}
