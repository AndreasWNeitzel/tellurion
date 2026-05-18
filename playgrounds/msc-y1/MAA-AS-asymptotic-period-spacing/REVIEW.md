# REVIEW - asymptotic-period-spacing (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Asymptotic period spacing (large n limit): Δ Π_n ~ π² c / (int_0^R omega N(r) dr), where omega is mode frequency, N is Brunt-Väisälä. Fundamental asteroseismology relation.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic from stellar models.

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

