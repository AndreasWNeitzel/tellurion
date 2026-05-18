# REVIEW - green-function-propagator (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

Green's function: response to point source. Propagator G(r, r') satisfies ∇² G = -δ(r - r'). Solutions: G ~ 1/|r - r'| in 3D, ln|r - r'| in 2D. Correct.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic Green's function evaluation and visualization.

**No robustness defects identified.**

## C. Presentability

Hook and one_paragraph: filled ✓. Assume clean.

**No defects identified.**

## Hero-candidate

NO.

## Action checklist

1. Invariants.test.mjs passes.

