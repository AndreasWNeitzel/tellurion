---
title: Quantum Confinement in Nanostructures
slug: quantum-confinement-nanostructure
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: davies1998
hook: 'Shrink the box and the levels fly apart: E_n = hbar^2 pi^2 n^2 / 2 m L^2, so E2 - E1 = 3 E1 and the gap grows as 1/L^2. Confine one, two or three directions and the density of states changes shape: E^1/2, staircase, spike, delta.'
one_paragraph: 'An interactive view of quantum confinement. A particle in an infinite square well of side L has quantised energies E_n = hbar^2 pi^2 n^2 / (2 m L^2): the levels scale as n^2 so E2 - E1 = 3 E1 exactly, and the ground-state confinement energy scales as 1/L^2, growing as the box shrinks and vanishing in the bulk limit. The left panel draws the well, the levels and the wavefunctions psi_n(x) = sin(n pi x / L). Which directions are confined sets the dimensionality, and the density of states takes a qualitatively different form in each: g(E) proportional to E^1/2 for the 3D bulk, a constant staircase for the 2D quantum well, (E - E_c)^-1/2 van Hove spikes for the 1D wire, and discrete delta peaks for the 0D dot. The right panel is that DOS with the optical-absorption onset marked. The n^2 spectrum with E2 - E1 = 3 E1, the 1/L^2 confinement scaling, the four density-of-states shapes and the optical-absorption onset are all closed form. Reference: Davies, The Physics of Low-Dimensional Semiconductors, Chapters 1 to 4.'
tags: [quantum, nanostructure, density-of-states, confinement, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [dimensionality, box_size, eff_mass]
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Quantum Confinement in Nanostructures

## Explainer

### What you are looking at

Shrink a piece of semiconductor in one, two, or three directions and
its electronic character changes qualitatively, not just
quantitatively. The playground takes the same particle and confines it
in 0, 1, 2, or 3 directions (bulk, quantum well, wire, dot) and shows
how the density of states reshapes, the physics behind quantum-dot
displays and laser diodes.

### Confinement quantizes some directions

A particle of effective mass $m$ in an infinite well of size $L$ in
the confined directions has quantized energies there,

$$E_n = \frac{\hbar^2\pi^2 n^2}{2 m L^2},$$

while the unconfined directions keep a free-particle continuum
$\hbar^2 k^2/2m$. The total energy is the sum: discrete sub-bands, each
with a continuum riding on top, and the number of confined directions
$d_c$ sets everything.

### The density of states by dimension

The shape of the density of states $g(E)$ (how many states per energy)
is the fingerprint of dimensionality:

- 3D bulk ($d_c=0$): $g(E)\propto\sqrt E$, smooth.
- 2D well ($d_c=1$): a staircase, constant within each sub-band,
  stepping up at each confined level.
- 1D wire ($d_c=2$): a series of $1/\sqrt{E-E_n}$ spikes (van Hove
  singularities) at each sub-band edge.
- 0D dot ($d_c=3$): pure delta functions, a discrete atomic-like
  spectrum (a quantum dot is an "artificial atom").

Because optical absorption and gain track $g(E)$, this is directly why
quantum-well lasers have sharp thresholds and quantum dots emit pure,
size-tunable colors. The playground switches $d_c$ and shows $g(E)$
morph from the bulk square-root to the dot's spikes.

### Things to try

- Step through bulk -> well -> wire -> dot and watch $g(E)$ go
  $\sqrt E$ -> staircase -> $1/\sqrt{}$ spikes -> delta lines.
- Shrink $L$ and watch the confined levels push apart as $1/L^2$
  (smaller dot, bluer emission).
- Note the dot's discrete spectrum: an artificial atom you can tune by
  size.

### Where this comes from

The particle-in-a-box quantization and the dimensionality-dependent
density of states follow Davies, *The Physics of Low-Dimensional
Semiconductors*, and Ashcroft and Mermin, *Solid State Physics*.

## Physical setup

A particle of effective mass `m` confined by an infinite square well
of side `L` in `d_c` of the three spatial directions and free in the
rest: `d_c = 0` is the 3D bulk, `1` a 2D quantum well, `2` a 1D
quantum wire, `3` a 0D quantum dot. Confinement quantises the energy
in the confined directions and leaves a free-particle continuum in
the others; the interplay sets the density of states, which has a
dimensionality-characteristic shape that governs optical absorption
and transport in real nanostructures.

## Governing equations

```math
E_n = \frac{\hbar^2 \pi^2 n^2}{2 m L^2}, \qquad
\psi_n(x) = \sqrt{\tfrac{2}{L}}\,\sin\!\frac{n\pi x}{L}.
```

So `E_n proportional to n^2` (hence `E_2 - E_1 = 3 E_1`) and the
ground-state confinement energy `E_1 proportional to 1/L^2`. The
density of states (Davies 1998; Ashcroft and Mermin):

- 3D bulk: `g(E) proportional to sqrt(E)`.
- 2D well: `g(E)` is a constant staircase, one step per subband.
- 1D wire: `g(E) proportional to sum (E - E_c)^{-1/2}` (van Hove).
- 0D dot: `g(E) = sum delta(E - E_lmn)` (discrete levels).

Units `hbar = 1`; energies in units of `pi^2 / (2 m L^2)`.

## Numerical method

No simulation: the spectrum, the wavefunctions and the four DOS
forms are evaluated in closed form in `sim.js`, so the invariants
hold to round-off and the run is deterministic. The Canvas2D
playground draws the well with its levels and wavefunctions (left)
and the selected-dimensionality DOS with the absorption onset
(right). Delta peaks for the dot are drawn as narrow Lorentzians for
display only; the gated quantities are the exact closed forms. No
engine reuse is required (closed-form algebra).

## Controls

- dimensionality: 3D bulk / 2D well / 1D wire / 0D dot, default dot.
- box size `L`: slider `0.6` to `5.0`, default `2.0`.
- effective mass `m`: slider `0.2` to `3.0`, default `1.0`.
- reset, pause: buttons (pause freezes the wavefunction breathing).
- Live monospace readouts: `E_1`, `E_2 - E_1` (and the ratio to
  `E_1`, which is `3.00`), the gap `E_1`, and the absorption onset.
- Share-state keys: `dimensionality`, `box_size`, `eff_mass`.

## Expected qualitative features

- The well shows `psi_n(x) = sin(n pi x / L)` at heights `E_n proportional to n^2`;
  the readout shows `E_2 - E_1 = 3.00 E_1`.
- Shrinking `L` pushes every level up (the gap grows as `1/L^2`);
  growing `L` collapses them toward the continuum (bulk limit).
- Switching dimensionality changes the DOS qualitatively: a
  `sqrt(E)` curve (bulk), a staircase (well), diverging spikes at
  subband edges (wire), discrete peaks (dot).
- The absorption onset sits at the effective gap (0 for bulk, the
  lowest confined level otherwise) and moves up as `L` shrinks.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- `n^2` spectrum (strong): `E_n = n^2 E_1`; `E_2 - E_1 = 3 E_1`
  exactly; `E_1 = pi^2 / (2 m L^2)` exactly.
- `1/L^2` scaling (strong): `E_1(2L) = E_1(L)/4`; `E_1 -> 0` as
  `L -> infinity`; the gap grows as `L` shrinks.
- 3D DOS (strong): `g proportional to sqrt(E)` (`g(4E)/g(E) = 2`).
- 2D DOS (strong): a non-decreasing staircase, flat within a
  subband, jumping up at each subband edge.
- 1D DOS (strong): diverges as `(E - E_c)^{-1/2}` approaching a
  subband edge from above (van Hove).
- absorption onset (medium): `0` in bulk, `> 0` when confined, and
  increasing as `L` shrinks.
- determinism (medium): pure functions reproduce outputs exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic dot sweep, SSIM at least `0.92` vs committed golden
frames. Deterministic (no RNG; closed form).

## Limiting cases for verification

- `L -> infinity`: `E_1 -> 0`, levels merge into the bulk `sqrt(E)`
  continuum.
- `L -> 0`: the gap diverges as `1/L^2`.
- bulk: continuous `sqrt(E)` DOS, zero absorption onset.
- dot: a discrete ladder, `E_n proportional to n^2`.

## Visual fallback

Pure Canvas2D over closed-form algebra: no WebGL, no solver, no RNG,
so the headless capture and SSIM gate are robust. The invariants run
GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Griffiths, Introduction to Quantum Mechanics (`griffiths-qm`), the
  infinite square well.
- Davies, The Physics of Low-Dimensional Semiconductors, CUP 1998
  (`davies1998`), the confinement energy and the dimensional DOS.
- Ashcroft and Mermin, Solid State Physics (`ashcroft-mermin`), the
  free-electron `sqrt(E)` density of states.

## Stretch goals

- Finite-barrier wells (tunnelling tails, finite level count).
- A real joint-DOS absorption spectrum with selection rules.
- An anisotropic box (different `L_x, L_y, L_z`).

## Risk register

- Delta-peak rendering: the 0D DOS is drawn as broadened Lorentzians
  for display; the gated quantities are the exact closed-form levels,
  not the broadening.
- Over-claiming a simulation: avoided; the model is exact algebra and
  the spec says so; the invariants are physical identities.
- Engagement: a static plot would be flat; mitigated by the
  qualitative DOS change on switching dimensionality, the breathing
  wavefunctions, and the size/mass sliders.

## Implementation notes

`sim.js` is self-contained closed-form physics (`energyLevel`,
`confinementGap`, `levels`, `dos`, `absorptionOnset`);
`invariants.test.mjs` imports it directly. `playground.js` is pure
Canvas2D: the well + levels + wavefunctions panel, the DOS panel with
the absorption onset, a throttled readout, and the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
