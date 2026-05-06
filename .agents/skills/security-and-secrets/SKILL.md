---
name: security-and-secrets
description: Use for Overlord security, secrets handling, API key safety, environment variables, credential boundaries, audit controls, Kalshi terms safety, rate limits, and preventing hardcoded secrets.
---

# Security and Secrets

## Purpose
Protect Overlord from credential leaks, unsafe integrations, and policy bypasses.

## When To Use
Use for secrets handling, API key questions, environment variable plans, credential boundaries, audit controls, terms compliance, and rate limit safety.

## When Not To Use
Do not create API key files, embed secrets, or bypass platform rules.

## Required Inputs
- Security concern or integration plan.
- Existing repo instructions.
- Relevant config or docs.

## Procedure
1. Check for hardcoded secrets and unsafe file patterns.
2. Keep credentials out of the repo.
3. Document future environment variable expectations without real values.
4. Enforce terms, account rules, rate limits, and safety controls.

## Outputs
- Security guidance, docs, secret-handling checklists, and review findings.

## Safety Checks
- No secret material.
- No live connector in current phase.
- No terms or rate-limit bypass.

## Examples
- "Review for hardcoded secrets."
- "Document future API key handling."
