# REVIEW - particle-in-a-well-zoo (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

TISE: -ℏ²/2m ψ''(x) + V(x)ψ(x) = E ψ(x) with hbar=m=1. Exact.

- Infinite well [0,L]: ψ_n(x) = √(2/L) sin(nπx/L), E_n = (nπ)²/(2L²). sim.js:28-34 is exact.
- Finite well [-a,a] depth V_0: transcendental match k tan(ka)=κ (even), k cot(ka)=-κ (odd) with k=√(2E), κ=√(2(V_0-E)). sim.js:57-94 bisection is correct. Bound-state count formula z_0/(π/2) with z_0 = a√(2V_0) properly implemented at sim.js:59. Test invariants.test.mjs:96-106 allow 3-5 states at a=1,V_0=15 to account for bracketing precision; correct.
- Harmonic oscillator: ψ_n(x) = N_n H_n(x) exp(-x²/2), E_n = n+1/2 exact. sim.js:131-152 uses standard Hermite recurrence H_{n+1}=2xH_n-2nH_{n-1} and correct normalization √(1/(2^n n! √π)). Verified to n=8, no overflow.

Limiting cases checked and consistent:
1. Finite well V_0→∞ at fixed a approaches infinite well with L=2a (verified in spec.md limiting-cases section).
2. Finite well shallow (V_0 < (π/2a)²/2) gracefully yields zero bound states; code returns [].
3. Node count: infinite well ψ_n has n-1 interior nodes, harmonic ψ_n has n zeros. invariants.test.mjs:79-93 confirm for n=0..4.

Invariants are **nontrivial and sufficient**: normalization, E_n energy-level ratios (n²-scaling for infinite well, constant spacing for harmonic), orthogonality, finite-well transcendental roots all lie below V_0 (invariants.test.mjs:113-116). These are not tautological.

**No physics defects identified.**

## B. Physics & numerical robustness

Bisection (sim.js:42-53): tol=1e-10, maxIter=100, robust for finite-well eigenenergy bracket. Poles of tan/cot handled correctly (lines 70-79, 81-90) by skipping intervals with no sign flip.

Finite-well wavefunction (sim.js:97-126): coefficient matching at ±a, exponential decay exp(-κ|x|) outside. Odd-parity sign flip (line 112) is correct: ψ_odd(-x)=-ψ_odd(x) implies sign=-1 for x<0.

Harmonic oscillator Hermite normalization (sim.js:147) uses textbook formula; n=0..8 has no numerical instability.

Numerical integration: trapezoidal rule with 400-1000 sample points, sufficient for visual fidelity and normalization checks to 1e-2.

Determinism: SEED and CAPTURE_NAME from URL (playground.js:12-14); five distinct capture stages (lines 242-248) cover infinite n=1,4; finite n=1,3; harmonic n=4. Fixed stages at each fraction ensure reproducibility. ✓

Live readout present on all golden frames (top-right corner): well type, n, E, bound-state count. Monospace, readable. ✓

**UX note (non-critical)**: slider-n max=8 but finite well may have <8 bound states. playground.js:147 silently clamps idx to levels.length-1. Safe but unannounced. Not a defect for shipping.

**No robustness defects identified.**

## C. Presentability

**Critical defect (HIGH)**: spec.md lines 10-11 contain placeholder template markers:
- `hook: 'STATUS: needs_hook'`
- `one_paragraph: 'STATUS: needs_paragraph'`

These are raw template strings, not actual hook/one_paragraph content. If the gallery card renderer uses these fields, the card displays broken template text to the user. **Shipping blocker.**

**Citation defect (MODERATE)**: index.html figcaption (lines 53-60) cites "Griffiths and Schroeter 2018, Sections 2.2-2.6" but includes no equation numbers (TISE numbering, infinite-well formula reference, etc.). Spec.md correctly lists eq references; figcaption should propagate them. Example fix: append "(Eq. 2.11 for TISE, Eq. 2.31 for infinite well)".

**No data-slot debris, missing files, or stale .verified markers.** ✓

Golden frames (5 distinct):
- t-000: infinite well n=1, ψ smooth, 0 nodes, E=1.234, walls visible, readout on.
- t-025: infinite well n=4, ψ shows 3 interior nodes, correct count.
- t-050: finite well n=1, ψ centered, exponential tails into grey forbidden region.
- t-075: finite well n=3, 2 interior nodes, clear tails.
- t-100: harmonic oscillator n=4, 4 zeros, Gaussian envelope.

All legible, axes labeled (x-axis: -0.5 to 2.5 for infinite; -3a to 3a for finite; -5 to 5 for harmonic). Levels labeled on left margin. Colormap blue for ψ, grey for V, red for selected level. No perceptual issues.

README (3 paragraphs): clear concept explanation, control descriptions, reference citations. Appropriate for first-exposure undergraduates.

## Hero-candidate

NO. Pedagogical anchor for textbook-standard 1D bound states, but visually unremarkable. Golden frames are cleanly rendered but lack distinctive visual engagement (no bifurcation, resonance, pattern formation, or surprising emergence). Belongs in curriculum suite, not featured shelf.

## Action checklist for maintainer

1. [BLOCKER] spec.md line 10: replace `hook: 'STATUS: needs_hook'` with a concise (one-line) tagline hook. Example: "Three textbook 1D quantum wells compared: infinite, finite, harmonic oscillator."
2. [BLOCKER] spec.md line 11: replace `one_paragraph: 'STATUS: needs_paragraph'` with a 1-sentence summary. Example: "Solve the time-independent Schrodinger equation for three canonical potentials and compare the resulting level ladders and wavefunctions."
3. [MODERATE] index.html figcaption: append equation references. Example: "(Griffiths 2018, Eq. 2.11 TISE, Eq. 2.31 infinite well, Sections 2.3-2.6 finite/harmonic)".
4. Verify gallery card renders without template-placeholder text after hooks are filled.
5. Invariants test passes (confirmed as of May 13). Rerun before ship to confirm no drift.

