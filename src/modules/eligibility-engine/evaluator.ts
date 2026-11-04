import {
  StudentProfileInput,
  RuleNode,
  ComparisonOperator,
} from "@/lib/schemas";

export type EligibilityOutcome =
  | "Potential match"
  | "Additional information required"
  | "Likely ineligible"
  | "Eligibility requires official verification";

export interface ClauseEvaluationDetail {
  conditionId: string;
  category: string;
  label: string;
  status:
    "SATISFIED" | "NOT_SATISFIED" | "MISSING_INFO" | "REQUIRES_VERIFICATION";
  explanation: string;
  field?: string;
}

export interface EligibilityEvaluationResult {
  scholarshipId: string;
  outcome: EligibilityOutcome;
  satisfiedConditions: ClauseEvaluationDetail[];
  unsatisfiedConditions: ClauseEvaluationDetail[];
  missingInformationConditions: ClauseEvaluationDetail[];
  verificationRequiredConditions: ClauseEvaluationDetail[];
  summaryExplanation: string;
  disclaimer: string;
  freshApplicationsOpen: boolean;
  ruleSchemaVersion: number;
}

type InternalNodeState = "TRUE" | "FALSE" | "UNKNOWN" | "VERIFY";

interface InternalEvaluation {
  state: InternalNodeState;
  satisfied: ClauseEvaluationDetail[];
  unsatisfied: ClauseEvaluationDetail[];
  missing: ClauseEvaluationDetail[];
  verify: ClauseEvaluationDetail[];
}

export const OFFICIAL_DISCLAIMER =
  "ScholarBridge provides deterministic rule-based assessments based on official scheme guidelines. This result is for informational guidance only and does not constitute an official sanction or guarantee of scholarship eligibility by NSP, UGC, AICTE, or any provider.";

export const RULE_SCHEMA_VERSION = 1;

function evaluateOperator(
  actual: unknown,
  operator: ComparisonOperator,
  expected: unknown
): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "lte":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual <= expected
      );
    case "gte":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual >= expected
      );
    case "lt":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual < expected
      );
    case "gt":
      return (
        typeof actual === "number" &&
        typeof expected === "number" &&
        actual > expected
      );
    case "in":
      return Array.isArray(expected) && expected.includes(actual as never);
    case "nin":
      return Array.isArray(expected) && !expected.includes(actual as never);
    default:
      return false;
  }
}

/**
 * Evaluates a single AST node against a partial student profile.
 *
 * PRECEDENCE RULES:
 * For leaf conditions:
 * - externalGateOnly === true => Always VERIFY (e.g. entrance test, interview)
 * - missing profile field => Always UNKNOWN (Fix D4: never returns VERIFY for omitted fields)
 * - operator comparison fails => FALSE
 * - operator comparison passes + requiresOfficialVerification => VERIFY
 * - operator comparison passes + !requiresOfficialVerification => TRUE
 *
 * For composite AND nodes:
 * - Precedence: FALSE > UNKNOWN > VERIFY > TRUE
 * - If any child is FALSE => FALSE (failing any mandatory condition disqualifies immediately)
 * - Else if any child is UNKNOWN => UNKNOWN (more info needed before verdict)
 * - Else if any child is VERIFY => VERIFY
 * - Else => TRUE
 *
 * For composite OR nodes (Fix D6):
 * - If any child is TRUE or VERIFY => satisfies the OR node (state of that child)
 * - Else if any child is UNKNOWN => UNKNOWN (accumulates all missing fields)
 * - Else (all failed) => FALSE, includes specific failure explanations of all branches
 */
function evaluateNode(
  node: RuleNode,
  profile: Partial<StudentProfileInput>
): InternalEvaluation {
  if (node.type === "CONDITION") {
    // Fix D4: externalGateOnly conditions (no self-reported profile field, e.g. Aptitude Test)
    if (node.externalGateOnly) {
      return {
        state: "VERIFY",
        satisfied: [],
        unsatisfied: [],
        missing: [],
        verify: [
          {
            conditionId: node.id,
            category: node.category,
            label: node.label,
            status: "REQUIRES_VERIFICATION",
            explanation:
              node.verificationNote ??
              `Official external gate: ${node.label} must be cleared.`,
          },
        ],
      };
    }

    const rawValue = profile[node.field];

    // Check if the field is missing (null, undefined, or empty string)
    // Fix D4: A missing field ALWAYS yields UNKNOWN, never VERIFY!
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return {
        state: "UNKNOWN",
        satisfied: [],
        unsatisfied: [],
        missing: [
          {
            conditionId: node.id,
            category: node.category,
            label: node.label,
            status: "MISSING_INFO",
            explanation: node.missingExplanation,
            field: node.field,
          },
        ],
        verify: [],
      };
    }

    const passed = evaluateOperator(rawValue, node.operator, node.value);

    if (!passed) {
      return {
        state: "FALSE",
        satisfied: [],
        unsatisfied: [
          {
            conditionId: node.id,
            category: node.category,
            label: node.label,
            status: "NOT_SATISFIED",
            explanation: `${node.failExplanation} (Profile value: ${String(rawValue)})`,
          },
        ],
        missing: [],
        verify: [],
      };
    }

    // Passed self-reported check, but requires nodal or documentary verification
    if (node.requiresOfficialVerification) {
      return {
        state: "VERIFY",
        satisfied: [
          {
            conditionId: node.id,
            category: node.category,
            label: node.label,
            status: "SATISFIED",
            explanation: node.passExplanation,
          },
        ],
        unsatisfied: [],
        missing: [],
        verify: [
          {
            conditionId: node.id,
            category: node.category,
            label: node.label,
            status: "REQUIRES_VERIFICATION",
            explanation:
              node.verificationNote ??
              `Requires official verification of ${node.label} by the nodal authority.`,
          },
        ],
      };
    }

    return {
      state: "TRUE",
      satisfied: [
        {
          conditionId: node.id,
          category: node.category,
          label: node.label,
          status: "SATISFIED",
          explanation: node.passExplanation,
        },
      ],
      unsatisfied: [],
      missing: [],
      verify: [],
    };
  }

  const childResults = node.children.map((child) =>
    evaluateNode(child, profile)
  );

  if (node.type === "AND") {
    const satisfied = childResults.flatMap((r) => r.satisfied);
    const unsatisfied = childResults.flatMap((r) => r.unsatisfied);
    const missing = childResults.flatMap((r) => r.missing);
    const verify = childResults.flatMap((r) => r.verify);

    // Conjunction Precedence: FALSE > UNKNOWN > VERIFY > TRUE
    let state: InternalNodeState = "TRUE";
    if (childResults.some((r) => r.state === "FALSE")) {
      state = "FALSE";
    } else if (childResults.some((r) => r.state === "UNKNOWN")) {
      state = "UNKNOWN";
    } else if (childResults.some((r) => r.state === "VERIFY")) {
      state = "VERIFY";
    }

    return { state, satisfied, unsatisfied, missing, verify };
  }

  // OR Node Evaluation (Fix D6)
  // 1. If at least one branch is TRUE or VERIFY, the disjunction is satisfied.
  const trueChild = childResults.find((r) => r.state === "TRUE");
  if (trueChild) {
    return {
      state: "TRUE",
      satisfied: trueChild.satisfied,
      unsatisfied: [],
      missing: [],
      verify: trueChild.verify,
    };
  }

  const verifyChild = childResults.find((r) => r.state === "VERIFY");
  if (verifyChild) {
    return {
      state: "VERIFY",
      satisfied: verifyChild.satisfied,
      unsatisfied: [],
      missing: [],
      verify: verifyChild.verify,
    };
  }

  // 2. If no branch succeeded and at least one is UNKNOWN, we need more info.
  const hasUnknown = childResults.some((r) => r.state === "UNKNOWN");
  if (hasUnknown) {
    return {
      state: "UNKNOWN",
      satisfied: [],
      unsatisfied: [],
      missing: childResults.flatMap((r) => r.missing),
      verify: [],
    };
  }

  // 3. All alternative branches failed deterministically (Fix D6: detailed branch failure explanations)
  const branchFailures = childResults
    .flatMap((r) => r.unsatisfied)
    .map((u) => u.explanation)
    .join("; ");

  return {
    state: "FALSE",
    satisfied: [],
    unsatisfied: [
      {
        conditionId: node.id,
        category: "academic",
        label: node.label,
        status: "NOT_SATISFIED",
        explanation: `None of the alternative pathways in "${node.label}" were satisfied: ${branchFailures}`,
      },
    ],
    missing: [],
    verify: [],
  };
}

/**
 * Deterministic Scholarship Eligibility Evaluator
 * Pure function: No I/O, no side effects, deterministic output.
 *
 * Implements:
 * - Fix D4: Missing fields always yield UNKNOWN, never VERIFY.
 * - Fix D5: When freshApplicationsOpen === false, outcome is never "Potential match".
 *           If profile passes, outcome becomes "Eligibility requires official verification"
 *           with status message: "Fresh applications not open yet – check portal".
 *           Precedence FALSE > UNKNOWN is strictly preserved!
 * - Fix D6: Rich OR-node failure breakdown and missing information collection.
 */
export function evaluateScholarshipEligibility(
  scholarshipId: string,
  ruleAst: RuleNode,
  profile: Partial<StudentProfileInput>,
  options?: {
    freshApplicationsOpen?: boolean;
    ruleSchemaVersion?: number;
  }
): EligibilityEvaluationResult {
  const result = evaluateNode(ruleAst, profile);
  const freshOpen = options?.freshApplicationsOpen !== false;
  const version = options?.ruleSchemaVersion ?? RULE_SCHEMA_VERSION;

  let outcome: EligibilityOutcome;
  let summaryExplanation: string;

  // Strict Precedence: FALSE > UNKNOWN > VERIFY > TRUE
  if (result.state === "FALSE") {
    outcome = "Likely ineligible";
    summaryExplanation = `Ineligible due to ${result.unsatisfied.length} unmet mandatory criteria: ${result.unsatisfied
      .map((u) => u.label)
      .join(", ")}.`;
  } else if (result.state === "UNKNOWN") {
    outcome = "Additional information required";
    summaryExplanation = `You meet ${result.satisfied.length} checked criteria, but ${result.missing.length} profile field(s) are required to complete matching: ${result.missing
      .map((m) => m.label)
      .join(", ")}.`;
  } else if (result.state === "VERIFY" || !freshOpen) {
    outcome = "Eligibility requires official verification";
    const verifyReasons = result.verify.map((v) => v.label);

    // Fix D5: Renewal-only overlay phrased as portal status
    if (!freshOpen) {
      verifyReasons.push(
        "Fresh applications not open yet – check portal for new cycle"
      );
      summaryExplanation = `Your profile satisfies core criteria (${result.satisfied.length} satisfied), but fresh applications are currently not open on the portal (renewal-only / pending merit list).`;
    } else {
      summaryExplanation = `Your profile satisfies all self-reported thresholds (${result.satisfied.length} criteria), subject to official verification of: ${verifyReasons.join(
        ", "
      )}.`;
    }
  } else {
    outcome = "Potential match";
    summaryExplanation = `Strong match: All ${result.satisfied.length} core eligibility conditions are satisfied based on your profile.`;
  }

  return {
    scholarshipId,
    outcome,
    satisfiedConditions: result.satisfied,
    unsatisfiedConditions: result.unsatisfied,
    missingInformationConditions: result.missing,
    verificationRequiredConditions: result.verify,
    summaryExplanation,
    disclaimer: OFFICIAL_DISCLAIMER,
    freshApplicationsOpen: freshOpen,
    ruleSchemaVersion: version,
  };
}
