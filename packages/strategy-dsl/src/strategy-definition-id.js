import { createHash } from "node:crypto";

export function strategyDefinitionId({ strategyName, strategyVersion, strategyType }) {
  const digest = createHash("sha256")
    .update([strategyName, strategyVersion, strategyType].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdef_${digest}`;
}
