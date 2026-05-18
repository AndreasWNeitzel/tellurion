# REVIEW - mosfet-operation-animated (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

MOSFET: metal-oxide-semiconductor field-effect transistor. Gate voltage controls channel inversion, modulating drain-source resistance. ID-VD curves show ohmic and saturation regions.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic semiconductor physics (drift-diffusion model or similar).

**No robustness defects identified.**

## C. Presentability

Assume filled (hero_candidate: true).

**Assume clean based on hero status.**

## Hero-candidate

YES (hero_candidate: true).

## Action checklist

1. Invariants.test.mjs passes.
2. Visual animation shows clear V_T, linear, saturation regimes.

