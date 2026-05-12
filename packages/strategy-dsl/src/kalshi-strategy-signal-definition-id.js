import { createHash } from "node:crypto";

/**
 * Produce a deterministic `kssd_`-prefixed ID for a KalshiStrategySignalDefinition.
 *
 * Inputs are joined with `|` and hashed with SHA-256.
 * The first 32 hex characters of the digest form the suffix.
 *
 * @param {{ definitionName: string, definitionVersion: string, sourceArtifactType: string, sourceSchemaVersion: string, definitionMode: string }} params
 * @returns {string}  e.g. "kssd_<32 hex chars>"
 */
export function kalshiStrategySignalDefinitionId({
  definitionName,
  definitionVersion,
  sourceArtifactType,
  sourceSchemaVersion,
  definitionMode,
}) {
  const digest = createHash("sha256")
    .update(
      [definitionName, definitionVersion, sourceArtifactType, sourceSchemaVersion, definitionMode].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kssd_${digest}`;
}
