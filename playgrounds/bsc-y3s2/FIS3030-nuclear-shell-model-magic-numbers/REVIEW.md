# REVIEW - nuclear-shell-model-magic-numbers (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Nuclear shell model: single-particle levels in a central potential, magic numbers 2, 8, 20, 28, 50, 82, 126 from closed shells. Spin-orbit coupling explains level ordering.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic level diagram generation from shell model parameters.

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

