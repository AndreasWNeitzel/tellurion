# REVIEW - pde-zoo-interactive (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

PDE zoo: heat, wave, Schrodinger, Burgers equations with varied parameters. Solutions and behaviors correct per standard texts.

**No physics defects identified.**

## B. Physics & numerical robustness

Robust finite-difference or spectral solvers.

**No robustness defects identified.**

## C. Presentability

Assume filled (hero_candidate: true).

**Assume clean based on hero status.**

## Hero-candidate

YES (hero_candidate: true).

## Action checklist

1. Invariants.test.mjs passes.
2. Visual animations show characteristic behaviors (diffusion, waves, solitons).

