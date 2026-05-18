# REVIEW - electric-field-lines-charges (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Governing equation: E(r) = sum_i q_i (r - r_i) / |r - r_i|^3, implemented in sim.js lines 17-27. Matches Griffiths, Introduction to Electrodynamics, Ch. 2. Field lines traced as integral curves of E via arc-length parametrization (sim.js lines 31-50), using explicit Euler with constant step ds = 0.04 and unit-speed integration.

Constants: Coulomb constant absorbed into normalized units (k=1). Regularization 1e-6 on r^2 prevents singularities.

Dimensional consistency: [E] = [charge] / [distance]^3 in normalized units. Correct.

Three limiting cases:
1. **Dipole symmetry:** Two charges ±q at (±0.8, 0). Midpoint (0, 0) field must be along the axis from +q to -q. invariants.test.mjs lines 23-28 verify E_y ≈ 0 (< 1e-12), E_x > 0. Correct.
2. **Two like charges midpoint:** Two charges +q at (±0.8, 0). Field at (0, 0) must vanish by symmetry. invariants.test.mjs lines 32-37 verify E_x ≈ 0, E_y ≈ 0 (both < 1e-12). Correct.
3. **Monopole far field:** Single charge +q at origin. |E| ≈ q/r^2 at r=5, within 1%. invariants.test.mjs lines 13-19 verify this with relative error tolerance 0.01 / r^2. Correct.

Additional invariants: Quadrupole decays faster than monopole at large r (lines 50-62). Sign reversal E([-q]) = -E([+q]) (lines 65-76). Emission geometry: 8 points per charge at distance 0.08 (lines 79-88). All non-trivial and correct.

Faithful, audited.

## B. Physics & numerical robustness
**Integrator:** Arc-length streamline tracing (sim.js lines 31-50) using explicit Euler with step ds = 0.04. Unit-speed integration is appropriate for field-line visualization; it ensures smooth curves without artificial time-dependence artifacts. Step size 0.04 is adequate for resolution.

**Test charge dynamics:** explicit Euler with dt = 0.005 for dv/dt = qE (mass=1). Stable for short durations; no PDE CFL condition applies.

**Conservation:** Field lines are geometric, not dynamical. Test charge dynamics dissipation/conservation is not checked. This is acceptable since the visualization focuses on trajectories, not energy.

**Determinism:** Fully deterministic. No stochasticity.

**Capture span:** Golden frames show preset progression: dipole (t-000), two-plus (t-025), quadrupole (t-050), monopole (t-075, t-100). Frames t-000 through t-050 show distinct field patterns. Frames t-075 and t-100 both show monopole configuration with visually nearly identical field-line patterns and test-charge positions. This suggests the capture does not advance the test-charge dynamics between t-075 and t-100, or the final two frames are both monopole (redundant). Recommendation: clarify capture intent. If the capture is meant to show dynamics within a single configuration, recapture t-075 and t-100 to show test-charge motion. If meant to show preset diversity, replace monopole duplication with a second distinct configuration.

## C. Presentability
**Hook and paragraph:** spec.md lines 10-11 are PLACEHOLDER DEFECTS:
```
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
```
These render on the gallery card as unfinished metadata. HIGH-severity blocker. Must replace with actual prose.

**Example prose:**
- Hook: "Electric field lines reveal the hidden geometry of the electric field: they are tangent to E at every point, and by Gauss's law, their density encodes the field strength. Watch how field lines emanate from positive charges and converge on negative ones in classic patterns: dipole bridges, repulsive lobes, and monopole radiance."
- One_paragraph: "Four canonical charge configurations (dipole, two-alike, quadrupole, monopole) display their characteristic field-line patterns. Press 'Shoot test charge' to launch a probe particle from the left edge; it accelerates toward negative charges and away from positive ones, tracing the Lorentz force F = qE in real-time. Drag any charge to reposition it and see field lines retrace live. The invariants confirm: monopole falls as 1/r^2, dipole midpoint field is purely axial, two-like charges have a zero-field equilibrium at the midpoint, and multipole terms decay faster at large distance."

**User-facing text:** index.html body text (lines 26-30) is clear and well-written. README.md (lines 1-30) is excellent, with specific expected features and a verification section.

**Golden frames:** All five are legible and visually distinct (t-000 to t-050). Frames show clear field patterns. On-canvas readouts (preset name, field-line count, equation, legend) are clear and informative. No text overlap or garbling. Colors (red/blue for charges, gold for field lines) are perceptually correct.

**Duplication note:** t-075 ≈ t-100 is a frame quality issue (see B. above).

## Hero-candidate
NO. Static pedagogical field-line visualization. No 3D, no emergent dynamics, no numerical complexity beyond simple Euler integration. Well-executed but not spotlight-worthy.

## Action checklist for maintainer
1. **Replace placeholder hook and one_paragraph (BLOCKER).** spec.md lines 10-11 must be filled with actual prose before shipping. Examples provided above; adjust to match the playground's voice.

2. **Clarify or fix t-075/t-100 frame duplication.** Review the visual test script and capture intent. If the capture is meant to show test-charge dynamics, advance the simulation between t-075 and t-100 so the frames are visually distinct. If frames are intentionally identical, update spec documentation to explain why.
