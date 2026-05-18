# REVIEW - mode-trapping-evolved-stars (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Mode trapping: acoustic glitches in stellar structure (H-He transition, core boundary) create avoided crossings in frequency vs mode order. Carriers of asteroseismic information.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic eigenfrequency calculations from stellar models.

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

