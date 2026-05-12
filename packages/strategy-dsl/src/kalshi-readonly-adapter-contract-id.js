import { createHash } from "node:crypto";

export function kalshiReadonlyAdapterContractId({
  adapterName,
  adapterVersion,
  allowedOperationCount,
  forbiddenOperationCount
}) {
  const digest = createHash("sha256")
    .update([adapterName, adapterVersion, allowedOperationCount, forbiddenOperationCount].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `krac_${digest}`;
}
