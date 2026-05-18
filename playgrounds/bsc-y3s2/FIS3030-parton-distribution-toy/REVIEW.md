# REVIEW - parton-distribution-toy (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Parton model: proton composed of quarks/gluons with momentum distribution x*f(x). Valence quarks peak at moderate x, sea quarks soft (low x). Gross-Llewellyn-Smith rule sum(xf_i) ≈ 1.

**No physics defects identified.**

## B. Physics & numerical robustness

Parametrized PDF shapes from QCD fits (PDFs are empirical). Deterministic visualizations.

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

