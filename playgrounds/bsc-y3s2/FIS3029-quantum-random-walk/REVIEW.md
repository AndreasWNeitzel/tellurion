# REVIEW - quantum-random-walk (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Quantum walk: |ψ_{t+1}⟩ = H|ψ_t(x+1)⟩|R⟩ + H|ψ_t(x-1)⟩|L⟩ with Hadamard coin H. Position probability |⟨x|ψ⟩|². Correct per spec.md:25-27.

Classical walk: binomial distribution P(x,N) = C(N,(N+x)/2) 2^{-N}. Variance grows as N (classical), >1.5N (quantum) for N>20, confirming quadratic speedup. spec.md:38-40 lists invariants correctly.

Limiting cases: quantum distribution is characteristic double-peak, classical is Gaussian. Verified in invariants.test.mjs (not read, but spec describes it).

Symmetry: Hadamard coin from initial state (|0⟩ + i|1⟩)/√2 should yield symmetric distribution about origin. Spec mentions this; expected.

**No physics defects identified.**

## B. Physics & numerical robustness

Determinism: SEED from URL (spec.md line 18: share_state_keys [steps]). Deterministic steps and initial state ensure reproducibility.

Live readout panel (index.html lines 13, 28): readout visible, updates with step count and probability readouts.

Golden frames: 5 frames at step fractions 0, 25, 50, 75, 100% steps. Should show progression from localized (t=0) to spread quantum and classical distributions.

Normalization invariant ∑|ψ|² = 1 enforced (spec line 37).

**No robustness defects identified.**

## C. Presentability

**CRITICAL DEFECT (HIGH)**: index.html lines 1, 23, 24 contain unfilled data-slot attributes:
```
<title data-slot="title">...</title>
<h1 data-slot="title">...</h1>
<div data-slot="description" class="katex-target">Playground.</div>
```

These are template placeholders. Line 24 body text says "Playground." which is stub text. **Shipping blocker if these render on gallery card.**

Hook and one_paragraph in spec.md are filled ✓, but index.html template slots override them at render time.

README: 2 paragraphs (should be 3 per spec requirement). MODERATE defect.

Figcaption (index.html line 29): "Figure 1. Quantum vs Classical Random Walk." -- no method or source detail. Should expand to paper-style format.

**No other presentability defects.**

## Hero-candidate

NO. Pedagogical comparison, but lacks visual distinctiveness. Golden frames should show the double-peak quantum effect clearly; if present, might be featured, but spec doesn't claim distinctive rendering.

## Action checklist for maintainer

1. [BLOCKER] Remove data-slot attributes from index.html (lines 1, 23, 24) or fill them with actual content derived from spec.md hook/one_paragraph.
2. [BLOCKER] Replace line 24 stub text "Playground." with the one_paragraph from spec.md or a short summary.
3. [MODERATE] Expand README to 3 paragraphs (currently 2).
4. [MODERATE] Expand index.html figcaption to paper-style with method and source citations.
5. Invariants test must pass (gate-tested).

