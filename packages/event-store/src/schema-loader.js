import { readFile } from "node:fs/promises";
import path from "node:path";

export const schemaVersionToFile = {
  "event_envelope.v1": "event_envelope.schema.json",
  "market_event.v1": "market_event.schema.json",
  "audit_event.v1": "audit_event.schema.json"
};

export async function loadEventStoreSchemas(repoRoot) {
  const schemaDir = path.join(repoRoot, "packages", "event-store", "schemas");
  const schemas = {};

  for (const [version, fileName] of Object.entries(schemaVersionToFile)) {
    const schemaPath = path.join(schemaDir, fileName);
    schemas[version] = JSON.parse(await readFile(schemaPath, "utf8"));
  }

  return schemas;
}
