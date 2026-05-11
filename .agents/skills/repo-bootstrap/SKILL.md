---
name: repo-bootstrap
description: Use when entering the Overlord repo cold, orienting on the current phase, identifying which package and docs to read first, or starting any agent session in this repo without prior context.
---

# Repo Bootstrap

## Purpose

Orient quickly in the Overlord repo and identify exactly what to read before touching code. Prevents context flooding and mis-scoped work.

## When To Use

Use at the start of any session where the current phase, active package, or safe work scope is unknown. Also use when switching between packages or resuming a paused task.

## When Not To Use

Do not use to design strategy logic, write validators, plan market recording, or work on any domain concern. Switch to the appropriate domain skill once oriented.

## Required Inputs

- None. Run the bootstrap sequence and let the output determine scope.

## Procedure

1. Read git state:
   ```bash
   git status
   git log --oneline -10
   ```

2. Read these files in order — no others until these are done:
   ```
   AGENTS.md
   docs/agent-operating-standard.md
   ```

3. Identify the current phase from `git log` and `AGENTS.md`.

4. Read the phase doc for the active phase only:
   ```bash
   # Example for Phase 4B
   cat docs/PHASE_4B_OBSERVATION_BOUNDARY_SCHEMA_LOCKDOWN.md
   ```

5. Read `package.json` scripts to understand what validators and tests are available.

6. Read only the files directly needed for the task. Do not open source files speculatively.

7. Run the smallest relevant validation before making any changes:
   ```bash
   npm run test:strategy-dsl
   npm run validate:strategy-observation-processing-contract
   ```

8. Confirm the current test baseline passes before touching anything.

## Outputs

- Confirmed current phase and latest commit
- Confirmed working test baseline
- Identified active package and task scope
- Ready to hand off to a domain skill

## Safety Checks

- Never run broad directory dumps or searches during bootstrap
- Never open source files without first reading AGENTS.md and the phase doc
- Always confirm tests pass before making changes
- Do not start work until the task scope is understood and bounded

## Examples

- "I just started a session in Overlord. What do I read first?"
- "Orient me before I start Phase 4F work."
- "Which package is active right now?"
- "What tests should I run before making changes?"
