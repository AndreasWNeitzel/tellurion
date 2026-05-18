# REVIEW - rotational-splitting-multiplets (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Rotational splitting: Coriolis effect lifts (2ℓ+1) degeneracy into multiplets Δν_rot = (2 / Λ) ∫ Ω(r) K(r) dr, where Λ depends on ℓ, m. Probes interior rotation.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic from stellar models and rotation profile.

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

