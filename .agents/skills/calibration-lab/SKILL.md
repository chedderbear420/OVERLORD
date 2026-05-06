---
name: calibration-lab
description: Use for calibration lab, probability calibration, Brier score, log loss, reliability curves, edge buckets, scorecards, drift diagnostics, and model probability quality.
---

# Calibration Lab

## Purpose
Evaluate whether probabilities, edge estimates, and strategy decisions are reliable enough for promotion.

## When To Use
Use for calibration curves, Brier score, log loss, edge buckets, scorecards, drift diagnostics, and reliability reports.

## When Not To Use
Do not promote models or strategies from anecdotal wins.

## Required Inputs
- Predictions.
- Labels.
- Replay traces.
- Paper ledger.
- Strategy and model versions.

## Procedure
1. Group predictions by probability and edge buckets.
2. Compute calibration and scoring metrics.
3. Compare expected value to realized paper outcomes.
4. Report drift, sample size, and uncertainty.

## Outputs
- Calibration reports, scorecards, promotion recommendations, and failure reasons.

## Safety Checks
- Require clean labels.
- Flag low sample sizes.
- Block promotion without replay and calibration evidence.

## Examples
- "Create a calibration scorecard."
- "Evaluate edge bucket performance."
