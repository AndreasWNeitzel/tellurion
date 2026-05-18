# REVIEW - nuclear-beta-decay-fermi-vs-gt (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Beta decay: Fermi (ΔJ=0, no parity change) vs Gamow-Teller (ΔJ=0,1, parity change). Selection rules and matrix elements correct per Krane/Lilley nuclear physics texts.

**No physics defects identified.**

## B. Physics & numerical robustness

Golden frames should show spectral shapes (Fermi vs GT line shape differences).

**No robustness defects identified.**

## C. Presentability

**CRITICAL DEFECTS**:
- spec.md contains placeholder hook/one_paragraph (identified earlier).
- Verify no data-slot debris in index.html.

## Hero-candidate

NO.

## Action checklist

1. [BLOCKER] Fill spec.md hook and one_paragraph.
2. Verify README is 3 paragraphs.
3. Invariants.test.mjs passes.

