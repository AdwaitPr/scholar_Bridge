import scholarshipsData from "../supabase/seed/scholarships.json";

interface ASTNode {
  type: string;
  field?: string;
  value?: unknown;
  operator?: string;
  children?: ASTNode[];
}

function findConditionsByField(node: ASTNode, field: string): ASTNode[] {
  const matches: ASTNode[] = [];
  if (node.type === "CONDITION" && node.field === field) {
    matches.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      matches.push(...findConditionsByField(child, field));
    }
  }
  return matches;
}

export function checkRuleConsistency(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const sch of scholarshipsData) {
    const ast = sch.rule_ast as ASTNode;

    // 1. Check max_income_inr column vs AST
    const incomeConditions = findConditionsByField(
      ast,
      "annual_family_income_inr"
    );
    if (incomeConditions.length > 0) {
      const astIncomeLimit = incomeConditions[0]?.value as number;
      if (sch.max_income_inr !== astIncomeLimit) {
        errors.push(
          `[${sch.code}] Income divergence: column max_income_inr=${sch.max_income_inr} but AST value=${astIncomeLimit}`
        );
      }
    } else {
      if (sch.max_income_inr !== null) {
        errors.push(
          `[${sch.code}] Income divergence: column max_income_inr=${sch.max_income_inr} but no income condition exists in AST`
        );
      }
    }

    // 2. Check education levels
    const eduConditions = findConditionsByField(ast, "education_level");
    if (eduConditions.length > 0) {
      const condition = eduConditions[0];
      const astEduLevels: string[] = Array.isArray(condition?.value)
        ? (condition.value as string[])
        : condition?.value
          ? [condition.value as string]
          : [];

      for (const level of astEduLevels) {
        if (!sch.allowed_education_levels.includes(level as never)) {
          errors.push(
            `[${sch.code}] Education level divergence: AST requires "${level}" but not present in allowed_education_levels column`
          );
        }
      }
    }

    // 3. Check allowed states if present
    const stateConditions = findConditionsByField(ast, "domicile_state");
    if (stateConditions.length > 0 && sch.allowed_states) {
      const condition = stateConditions[0];
      const astStates: string[] = Array.isArray(condition?.value)
        ? (condition.value as string[])
        : condition?.value
          ? [condition.value as string]
          : [];

      for (const st of astStates) {
        if (!sch.allowed_states.includes(st)) {
          errors.push(
            `[${sch.code}] State divergence: AST requires state "${st}" but not present in allowed_states column`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

if (process.argv[1]?.includes("check-rule-consistency")) {
  const result = checkRuleConsistency();
  if (!result.valid) {
    console.error("Rule consistency check FAILED with divergences:");
    result.errors.forEach((err) => console.error(" - " + err));
    process.exit(1);
  } else {
    console.log(
      "Rule consistency check PASSED: all 16 scholarships columns match their ASTs."
    );
  }
}
