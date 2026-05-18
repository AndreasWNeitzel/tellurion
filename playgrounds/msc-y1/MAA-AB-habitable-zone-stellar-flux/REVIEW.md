# REVIEW - habitable-zone-stellar-flux (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Habitable zone: distance from star where liquid water can exist. Flux F = L / (4π d²) sets temperature; boundaries depend on stellar mass and age. Standard astrobiology.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic calculation from stellar parameters.

**No robustness defects identified.**

## C. Presentability

**CRITICAL DEFECTS**:
- spec.md placeholder hook/one_paragraph.
- Verify README is 3 paragraphs.

## Hero-candidate

NO.

## Action checklist

1. [BLOCKER] Fill spec.md hook and one_paragraph.
2. Verify README is 3 paragraphs.
3. Invariants.test.mjs passes.

