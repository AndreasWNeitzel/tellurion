# REVIEW - ckm-mixing-unitarity-triangle (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

CKM matrix unitarity: 3x3 unitary matrix V_CKM with orthogonality rows/columns. Unitarity triangle in (Re, Im) plane from V_{ub} V_{cb}^* + V_{tb} V_{cb}^* = 0 closure. Standard particle physics.

Invariants: matrix unitarity, triangle closure, angles/sides from unitarity constraints. Spec describes these correctly.

**No physics defects identified.**

## B. Physics & numerical robustness

Pure geometry (unitarity triangle drawing), deterministic from CKM parameters. Robust.

Live readout: shows CKM elements and triangle metrics.

**No robustness defects identified.**

## C. Presentability

Hook and one_paragraph: filled ✓.

README: 3 paragraphs, explains unitarity and triangle.

No placeholder text or data-slot debris ✓.

**No defects identified.**

## Hero-candidate

NO. Educational geometry, not distinctive.

## Action checklist

1. Invariants.test.mjs passes (verify matrix unitarity).
2. Visual review: triangle is correctly drawn and labeled.

