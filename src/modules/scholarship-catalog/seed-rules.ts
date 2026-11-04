import { RuleNode } from "@/lib/schemas";
import scholarshipsData from "../../../supabase/seed/scholarships.json";

const pragati = scholarshipsData.find((s) => s.code === "SCH-01");
const nspgs = scholarshipsData.find((s) => s.code === "SCH-05");
const csss = scholarshipsData.find((s) => s.code === "SCH-07");
const reliancePg = scholarshipsData.find((s) => s.code === "SCH-15B");

export const AICTE_PRAGATI_DEGREE_RULE_AST: RuleNode = pragati!
  .rule_ast as RuleNode;
export const UGC_NATIONAL_PG_RULE_AST: RuleNode = nspgs!.rule_ast as RuleNode;
export const PM_USP_CSSS_RULE_AST: RuleNode = csss!.rule_ast as RuleNode;
export const RELIANCE_PG_RULE_AST: RuleNode = reliancePg!.rule_ast as RuleNode;
