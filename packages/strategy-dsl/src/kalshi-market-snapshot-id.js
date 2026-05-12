import { createHash } from "node:crypto";

/**
 * Deterministic SHA-256 ID for a Kalshi market snapshot.
 * Prefix: kms_  Length: 4 + 32 hex chars.
 * Inputs: sourceSystem | marketTicker | ingestMode | schemaVersion
 */
export function kalshiMarketSnapshotId({
  sourceSystem,
  marketTicker,
  ingestMode,
  schemaVersion,
}) {
  const digest = createHash("sha256")
    .update([sourceSystem, marketTicker, ingestMode, schemaVersion].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `kms_${digest}`;
}
