---
name: ml-governance
description: Use for ML governance, model registry, feature store, labeling, clean data, no-lookahead labels, training data, model promotion, calibration reports, and machine learning gates.
---

# ML Governance

## Purpose
Govern machine learning promotion through clean data, labels, replay, calibration, and risk review.

## When To Use
Use for feature store design, labeling, model registry, model promotion gates, train/test discipline, and ML scorecards.

## When Not To Use
Do not approve models without clean data, labels, replay results, and calibration reports.

## Required Inputs
- Dataset definition.
- Feature version.
- Label version.
- Model version.
- Replay and calibration reports.

## Procedure
1. Verify data lineage and label integrity.
2. Check no-lookahead controls.
3. Require replay validation and calibration reports.
4. Register model status and promotion blockers.

## Outputs
- Model registry entries, ML governance notes, and promotion checklists.

## Safety Checks
- No hidden datasets.
- No unversioned features.
- No promotion from unaudited results.

## Examples
- "Define model registry fields."
- "Review ML promotion gates."
