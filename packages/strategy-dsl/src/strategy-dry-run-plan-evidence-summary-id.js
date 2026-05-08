import { createHash } from "node:crypto";

export function strategyDryRunPlanEvidenceSummaryId({
  strategyDryRunPlanId,
  validationStatus,
  allowedInputArtifactCount,
  forbiddenOutputCount,
  plannedObservationStepCount,
  safetyConstraintCount,
  generatedAt
}) {
  const digest = createHash("sha256")
    .update([
      strategyDryRunPlanId,
      validationStatus,
      allowedInputArtifactCount,
      forbiddenOutputCount,
      plannedObservationStepCount,
      safetyConstraintCount,
      generatedAt
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrpes_${digest}`;
}
