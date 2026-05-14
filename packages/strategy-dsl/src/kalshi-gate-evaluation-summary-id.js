import { createHash } from "node:crypto";
const SCHEMA_VERSION = "kalshi_gate_evaluation_summary.v1";
export function kalshiGateEvaluationSummaryId({phase,evaluationStatus,gatesPassedCount}) {
  if (!phase || !evaluationStatus || gatesPassedCount == null) throw new Error("kalshiGateEvaluationSummaryId: all inputs required");
  const digest = createHash("sha256").update([phase,SCHEMA_VERSION,evaluationStatus,String(gatesPassedCount)].join("|")).digest("hex").slice(0,32);
  return `kges_${digest}`;
}
