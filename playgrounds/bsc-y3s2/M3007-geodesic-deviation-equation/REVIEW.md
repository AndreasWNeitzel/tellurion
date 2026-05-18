# REVIEW - geodesic-deviation-equation (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Geodesic deviation: D²V^μ / Dt² + R^μ_νρσ (dγ/dt)^ρ (dγ/dt)^σ V^ν = 0. Describes how geodesics separate in curved spacetime.

**No physics defects identified.**

## B. Physics & numerical robustness

Deterministic integration of deviation equation on curved manifold.

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

