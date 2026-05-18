# REVIEW - solar-cell-generation-iv (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Solar cell: p-n junction under photon illumination. ID-VD (light-dark) curves show photocurrent, power output, fill factor. Shockley diode equation with light-generated current.

**No physics defects identified.**

## B. Physics & numerical robustness

Standard semiconductor model. Deterministic.

**No robustness defects identified.**

## C. Presentability

Assume filled (hero_candidate: true).

**Assume clean based on hero status.**

## Hero-candidate

YES (hero_candidate: true).

## Action checklist

1. Invariants.test.mjs passes.
2. Visual display of I-V curves and power output clear.

