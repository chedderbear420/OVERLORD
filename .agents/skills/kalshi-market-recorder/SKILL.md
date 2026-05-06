---
name: kalshi-market-recorder
description: Use for Kalshi market recorder, black box recorder, raw market snapshots, market event capture, event store ingestion, timestamping, provenance, and immutable sports prediction-market evidence.
---

# Kalshi Market Recorder

## Purpose
Design recorder workflows that preserve raw market evidence before normalization or strategy logic.

## When To Use
Use for black box recorder planning, raw snapshots, order book updates, event ids, timestamps, provenance, and event store contracts.

## When Not To Use
Do not connect to Kalshi, create API keys, scrape around terms, or implement live ingestion in the current phase.

## Required Inputs
- Market event types to record.
- Timestamp and source metadata requirements.
- Event store expectations.

## Procedure
1. Define immutable raw event schemas.
2. Include source, observed time, received time, sequence, and checksum concepts.
3. Preserve enough detail for deterministic replay.
4. Separate recorder concerns from normalization and strategy decisions.

## Outputs
- Recorder design notes, schemas, event flow, and validation requirements.

## Safety Checks
- No credentials.
- No live connector code.
- No rate limit bypass.
- Raw evidence must remain immutable.

## Examples
- "Design the black box recorder schema."
- "Plan event provenance for Kalshi snapshots."
