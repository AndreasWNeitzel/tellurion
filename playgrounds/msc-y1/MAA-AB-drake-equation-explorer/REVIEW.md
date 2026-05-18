# REVIEW - drake-equation-explorer (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Drake equation: N = R* * f_p * n_e * f_l * f_i * f_c * L, estimating detectable civilizations. Parameters uncertain but framework standard in astrobiology.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic slider-driven calculation.

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

