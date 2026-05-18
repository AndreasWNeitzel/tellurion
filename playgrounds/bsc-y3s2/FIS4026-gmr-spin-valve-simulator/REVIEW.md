# REVIEW - gmr-spin-valve-simulator (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Giant magnetoresistance: two ferromagnetic layers with parallel/antiparallel alignment. Resistance varies as R = R_AP when spins antiparallel, R = R_P when parallel. MR ratio (R_AP - R_P)/R_P.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic resistance calculation from layer magnetization states.

**No robustness defects identified.**

## C. Presentability

Hook and one_paragraph: assumed filled (hero_candidate: true implies full spec).

No placeholder or data-slot debris expected.

**Assume clean based on hero status.**

## Hero-candidate

YES (marked hero_candidate: true). Assume visual polish confirmed if marked.

## Action checklist

1. Invariants.test.mjs passes.
2. Golden frames visually distinctive (resistance curve, layer alignment diagram).

