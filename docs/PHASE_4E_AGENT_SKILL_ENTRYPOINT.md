# Phase 4E: Agent Skill Entrypoint / Repo Bootstrap

## Goal

Give Claude Code and Codex agents a structured, low-noise entrypoint into the Overlord repo so that every session starts oriented — current phase known, safety rules loaded, test baseline confirmed — before any code is touched.

## Deliverables

### CLAUDE.md (repo root)

Claude Code loads `CLAUDE.md` automatically at session start. This file is the primary entrypoint for Claude Code agents. It covers:

- Repo identity and current phase table
- Start-of-session bootstrap sequence (git status → git log → read AGENTS.md → read agent-operating-standard.md)
- High-signal repo layout (8 paths, no full tree dump)
- Key `npm run` commands for Phase 4C/4B validators and tests
- Forbidden behaviors in explicit list form
- Phase report format pointer
- Reference to AGENTS.md as the full authoritative rule source

Design principle: CLAUDE.md should be readable in under 60 seconds. It points outward rather than duplicating content from AGENTS.md or the agent operating standard.

### .agents/skills/repo-bootstrap/SKILL.md

An orientation skill consistent with the 15 existing domain skills under `.agents/skills/`. Codex agents can invoke this skill explicitly when entering the repo cold. It defines:

- Exact file read order (git state → AGENTS.md → agent-operating-standard.md → phase doc → package.json)
- When to stop bootstrapping and hand off to a domain skill
- Safety checks: no broad searches, no speculative file opening, no work before baseline tests pass

## What this phase does not include

- No live data paths
- No Kalshi connectivity
- No credential handling
- No execution logic
- No changes to validators, fixtures, schemas, or tests

## Phase prerequisites confirmed

| Check | Result |
|---|---|
| Phase 4B boundary validators pass | yes — 138 strategy-dsl tests |
| Phase 4C dashboard safety scan | yes — 21/21 |
| Phase 4D agent-operating-standard.md exists | yes — `docs/agent-operating-standard.md` |
| No existing CLAUDE.md to conflict with | yes — none existed before this phase |

## Completion rule

Phase 4E is complete when:

1. `CLAUDE.md` exists at the repo root and loads correctly in a Claude Code session
2. `.agents/skills/repo-bootstrap/SKILL.md` exists and follows the established skill format
3. This phase doc exists in `docs/`
4. No validators or tests were broken

## Recommended next phase

**Phase 4F: No-op Observation Processing Trace Shell**

Add the observation processing trace and noop summary that Phase 4C's dashboard is designed to eventually display. Keep it strictly offline and fixture-driven. No live inference, no network calls.
