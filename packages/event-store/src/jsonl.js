import { readFile } from "node:fs/promises";

export async function readJsonl(filePath) {
  const text = await readFile(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const records = [];

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (line.trim().length === 0) {
      continue;
    }

    try {
      records.push({
        lineNumber,
        value: JSON.parse(line)
      });
    } catch (error) {
      throw new Error(`Invalid JSONL at line ${lineNumber}: ${error.message}`);
    }
  }

  return records;
}
