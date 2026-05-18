# REVIEW - abelian-sandpile-btw (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Governing equations: z(x,y) -= 4 if z(x,y) >= 4; each neighbor +1 within lattice; cascade until stable (sim.js lines 43-54). Matches spec lines 33-35. Constants: L = 32, threshold = 4, 4-nearest neighbors. Units: heights dimensionless integer counts; power-law exponent tau = 1.21 empirical (Bak 1996). Limiting cases:
(1) 1D variant has tau = 1 exactly (spec line 61); code supports arbitrary L_size.
(2) Boundary dissipation (sim.js line 50): grains fall off, preventing divergence (spec line 62).
(3) Steady state: heights bounded [0,3] (spec line 51). After initialization at 0 and toppling rule z_i = z_i mod 4, no site exceeds 3. Invariant test line 12-19 verifies over 5000 drops.

Invariant tests (invariants.test.mjs) are comprehensive and nontrivial:
- Heights [0,3] after 5000 drops (line 12-19): real-time constraint check.
- Topple count non-negative (line 22-29): 2000 drops test.
- Max avalanche > 10 after 10k drops (line 32-38): emergence of large cascades.
- Histogram populated (line 41-50): binning and counting test.
- L = 32 constant (line 53-56): exported interface check.
All test physics constraints, not tautologies. Faithful, audited.

## B. Physics & numerical robustness
Scheme: event-driven deterministic toppling using queue (sim.js lines 41-55). No time integration. Stability: N/A. Conservation: grain loss at boundary is intentional dissipation (dissipation rule: grains exit at edges, driving criticality). Histogram normalization (sim.js lines 78-82) divides by bin width and sample count to produce proper P(s). Extremes: grid is Int16Array (line 22), supports max ~32k grains per cell; no overflow in practice. Boundary conditions: grains at edges drop off (line 50, correct for SOC). Determinism: RNG seeded (line 26); queue toppling is deterministic. Same seed yields identical evolution. Capture span: frames t-000 (t=100, max_av=0), t-050 (t=2100, max_av=77), t-100 (t=4100, max_av=1807) are objectively distinct. Mean avalanche: 0 -> 0.53 -> 19.22. Histogram maturity: empty -> developing -> clear power-law tail. Frames correctly show self-organization progression.

## C. Presentability
BLOCKER: spec.md lines 10-11 contain `hook: 'STATUS: needs_hook'` and `one_paragraph: 'STATUS: needs_paragraph'`. These render on public gallery card as raw status strings. Figcaption (index.html lines 48-53) is paper-style and correct: "Figure 1. BTW sandpile. Method: drive-threshold-dissipation rule on 32 x 32 lattice. Source: Bak 1996, How Nature Works (bak1996); Bak-Tang-Wiesenfeld 1987 PRL." README.md (lines 1-29) adequate: three short paragraphs, undergrad level, explains drop-topple-cascade, power-law emergence, visual interpretation. Golden frames legible at card scale. Colors represent heights (dark = 0, bright = 3), perceptually clear. Histogram shows progression from empty to power-law tail with reference line. Frames visually distinct.

## Hero-candidate
NO. Classic pedagogical model, correct physics, but no emergent visual dynamics comparable to Phong 3D or N-body systems.

## Action checklist for maintainer
1. Edit spec.md line 10: replace `hook: 'STATUS: needs_hook'` with actual hook (e.g., `hook: 'Watch a sandpile self-organize into a critical state with power-law avalanche cascades.'`).
2. Edit spec.md line 11: replace `one_paragraph: 'STATUS: needs_paragraph'` with description (e.g., `one_paragraph: 'Drop grains randomly on a 32x32 lattice. Sites with height >= 4 topple, sending one grain to each neighbor. Cascades form avalanches. The system organizes itself into a critical state with power-law avalanche-size distribution P(s) ~ s^(-1.21), a hallmark of self-organized criticality.'`).
3. Verify invariants.test.mjs still passes.
