export function riskDecisionId(signalId, policyId) {
  return `risk_${sanitize(signalId)}_${sanitize(policyId)}`;
}

export function actionDecisionId(riskDecisionIdValue) {
  return `action_${sanitize(riskDecisionIdValue)}`;
}

function sanitize(value) {
  return String(value ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
}
