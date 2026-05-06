import { mkdir, open, stat } from "node:fs/promises";
import path from "node:path";
import { readPaperExitRecords } from "./paper-exit-reader.js";
import { validatePaperExitRecords } from "./validate-paper-exits.js";

export async function createPaperExitFile(exitPath) {
  await mkdir(path.dirname(exitPath), { recursive: true });
  const file = await open(exitPath, "wx");
  await file.close();
  return exitPath;
}

export async function appendPaperExits(options) {
  const exitPath = options.exitPath;
  const exits = options.exits ?? [];
  const existingRecords = await readExistingRecords(exitPath);
  const candidateRecords = exits.map((exit, index) => ({
    lineNumber: existingRecords.length + index + 1,
    value: exit
  }));
  const validation = validatePaperExitRecords([...existingRecords, ...candidateRecords]);

  if (!validation.ok) {
    return {
      ok: false,
      appended: 0,
      errors: validation.errors
    };
  }

  await mkdir(path.dirname(exitPath), { recursive: true });
  const file = await open(exitPath, "a");
  try {
    for (const exit of exits) {
      await file.write(`${JSON.stringify(exit)}\n`);
    }
  } finally {
    await file.close();
  }

  return {
    ok: true,
    appended: exits.length,
    errors: []
  };
}

async function readExistingRecords(exitPath) {
  try {
    await stat(exitPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return readPaperExitRecords(exitPath);
}
