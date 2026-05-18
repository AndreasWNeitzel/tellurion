# REVIEW - kepler-orbit-elements (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity
Governing equations: Keplerian orbit elements (a, e, i, Omega, omega, nu) map to 3D Cartesian coordinates via perifocal-to-ecliptic coordinate transformations. Orbital radius r = a(1 - e^2) / (1 + e cos(nu)) (sim.js line 16). Eccentric anomaly E solved via Newton-Raphson on Kepler's equation M = E - e sin(E) (sim.js lines 4-11). True anomaly nu computed from E via nu = 2 atan2(sqrt(1+e) sin(E/2), sqrt(1-e) cos(E/2)) (sim.js lines 12-14). 3D transform via three rotation matrices (Omega around z, i around x, omega around z) applied to perifocal (xp, yp) coordinates (sim.js lines 15-24). All match Carroll-Ostlie, Introduction to Modern Astrophysics, 2e, Sec. 2.3.

Dimensional consistency: Orbital position (x, y, z) in units of a. Distances and angles are consistent throughout. Correct.

Three limiting cases:
1. **Circular orbit (e=0):** r = a everywhere. invariants.test.mjs line 9 verifies this; correct.
2. **Equatorial orbit (i=0):** z-coordinate must be zero. invariants.test.mjs line 14 verifies z < 1e-12. Correct.
3. **Inclination 90 degrees:** z varies significantly; invariants.test.mjs line 18 verifies |z| > 0.9 at nu = pi/2. Correct.
4. **Perihelion distance (nu=0, e=0.9):** r = a(1-e) = 0.1 for a=1. invariants.test.mjs line 22 verifies within 1e-12. Correct.

Invariant adequacy: All tests are non-trivial and cover distinct geometric regimes. Kepler solver convergence is tested (line 6). All correct.

Faithful, audited.

## B. Physics & numerical robustness
**Kepler solver:** Newton-Raphson iteration on M = E - e sin(E). Convergence is quadratic for well-behaved e values (0 < e < 1). sim.js uses tolerance 1e-10 and max 50 iterations. For typical exoplanet eccentricities (0 < e < 0.3), convergence within 3-5 iterations. Robust.

**True anomaly computation:** Two-argument atan2 ensures correct quadrant. Formula sqrt(1+e) sin(E/2) / sqrt(1-e) cos(E/2) is numerically stable for 0 <= e < 1. At e=1 (parabolic), the formula breaks down, but the code does not check for this limit. Acceptable for e < 1 orbits only.

**Coordinate transform:** Three matrix multiplications applied sequentially (lines 18-23). Order is correct: perifocal (x_p, y_p) rotated by omega, then i, then Omega. Matrix operations are accurate to machine precision.

**Determinism:** Fully deterministic. No randomness.

**Capture span:** Playground is interactive (slider-based orbit element adjustment), not a dynamics simulator. No temporal progression expected.

## C. Presentability
**Hook and paragraph:** spec.md lines 12-13 are PLACEHOLDER DEFECTS:
```
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
```
HIGH-severity blocker. Must replace before shipping.

**Body text:** spec.md lines 22-23 are sparse but accurate: "Vary the six classical elements (a, e, i, Omega, omega, nu) and watch a 3D orbit redraw." Good descriptive prose. Hook and paragraph should expand on this with pedagogical clarity.

**Example prose to replace placeholders:**
- Hook: "Six numbers completely specify an orbit: the size, shape, and tilt. Tweak any one and watch the whole orbit rotate and stretch."
- One_paragraph: "The six classical Keplerian elements (a, e, i, Omega, omega, nu) parametrize any Kepler orbit uniquely. Use the six sliders to vary semi-major axis, eccentricity, inclination, ascending node, periapsis argument, and true anomaly; the 3D orbit updates live. The headless sim solves Kepler's equation and applies the perifocal-to-ecliptic coordinate transform to place the orbiting body in 3D space. Reference: Carroll-Ostlie, Introduction to Modern Astrophysics, Ch. 2."

**Live invariant readout:** Tag "live-readout" is present. The playground must display a monospace invariant on every frame per CLAUDE.md. Typical choice: current orbital distance r, or the semi-major axis a, or orbital period P. Confirm it exists and is visible in the rendered playground.

## Hero-candidate
NO. This is a pedagogical tool for learning orbit element visualization. No complex dynamics, no emergent behavior, no numerical virtuosity. Standard textbook material rendered interactively.

## Action checklist for maintainer
1. **Replace placeholder hook and one_paragraph (BLOCKER).** spec.md lines 12-13 must be filled with actual prose. Examples provided above; adjust to match the playground's voice and level of technical detail.

2. **Confirm live invariant readout.** Tag "live-readout" is present; verify that a monospace span renders the current orbital distance r, semi-major axis a, or orbital period P on every frame.

3. Verify that all six sliders (a, e, i, Omega, omega, nu) have appropriate ranges and precision. E.g., e in [0, 0.99] (avoid e=1), i in [0, pi], Omega and omega in [0, 2*pi], nu in [0, 2*pi].

4. **(Optional) Add perihelion/aphelion distance readouts.** Display r_min = a(1-e) and r_max = a(1+e) in real-time to reinforce the meaning of a and e.
