# REVIEW - curvature-tensor-2d-surfaces (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Curvature tensor on 2D surfaces: R_μνρσ = ∂_ν Γ^λ_μσ - ... (Riemann tensor in 2D). Gaussian curvature K = det(II) / det(I), mean curvature H.

**No physics defects identified.**

## B. Physics & numerical robustness

Tensor calculations from surface parameterization deterministic.

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

