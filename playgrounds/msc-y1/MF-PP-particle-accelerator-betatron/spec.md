---
title: "FODO Synchrotron: Betatron Tune, Emittance and Stop Bands"
slug: particle-accelerator-betatron
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-PP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: courant-snyder1958
hook: 'A thin-lens FODO synchrotron solved with the Courant-Snyder formalism: the one-turn transfer matrix sets the betatron tune through cos(mu) = trace(M)/2, the emittance ellipse area is conserved turn after turn, and below a critical quad strength the cell crosses into a stop band where the orbit grows without bound.'
one_paragraph: 'A linear transverse-beam-dynamics playground for a FODO synchrotron (Courant and Snyder 1958; Wiedemann, Particle Accelerator Physics). Each thin quadrupole and drift is a 2x2 symplectic transfer matrix; the one-turn map gives the Courant-Snyder (Twiss) parameters, the betatron tune from cos(mu) = trace(M)/2, and the invariant emittance ellipse. Panel A shows the ring with alternating focusing and defocusing quads, a circulating bunch and the periodic beta function across one cell. Panel B is the transverse phase space: a tracked particle lands turn after turn on its invariant ellipse, with the single-particle emittance constant to machine precision, or, in a stop band, no ellipse exists and the amplitude diverges. Panel C is the stability diagram, trace(M_cell)/2 and the tune versus quad focal length, with the f < L/4 stop band and the integer / half-integer resonance lines, plus the dipole magnetic rigidity B rho = p / (0.299792458 q) and d p / d t = q v B. The numerics are the gate-tested closed-form sim.js: exact transfer matrices and Twiss analysis, deterministic with no RNG. Invariants check symplecticity (det = 1), the stop-band edge, the tune relation, the Twiss reconstruction with beta*gamma - alpha^2 = 1, Liouville conservation of the emittance over many turns, the dipole rigidity identity and the resonance divergence.'
tags: [particle-physics, accelerator, beam-dynamics, courant-snyder, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [f, nc, B]
---

# FODO Synchrotron: Betatron Tune, Emittance and Stop Bands

## Explainer

### What you are looking at

A particle in a circular accelerator must be steered around the ring
millions of times without drifting into the wall. It is kept on
course by alternating focusing and defocusing magnets, the same trick
as alternating-gradient "strong focusing". The playground propagates a
particle through a FODO lattice and shows whether the motion is
stable, its oscillation frequency (the tune), and the beam ellipse.

### Transfer matrices and the FODO cell

Transverse motion in one plane is the phase-space vector $(x, x')$
(position and angle). Each magnet or drift acts as a $2\times2$
transfer matrix; for example a thin quadrupole of focal length $f$
and a drift of length $L$ are

$$Q = \begin{pmatrix}1 & 0\\ \mp 1/f & 1\end{pmatrix},
  \qquad
  D = \begin{pmatrix}1 & L\\ 0 & 1\end{pmatrix}.$$

A FODO cell is focus-drift-defocus-drift; multiplying the matrices
gives the one-cell map $M$.

### Stability and the tune

A quadrupole that focuses in $x$ defocuses in $y$, so no single lens
confines both planes. Alternating them does: the one-turn matrix $M$
keeps the motion bounded only if

$$\big|\tfrac12\,\mathrm{Tr}\,M\big| < 1,$$

which is the stability condition. When it holds, the particle
oscillates around the ring (betatron oscillation) with a phase
advance $\cos\mu = \tfrac12\mathrm{Tr}\,M$ per cell; the number of
such oscillations per turn is the betatron tune $\nu$. The invariant
ellipse the trajectory traces (the Courant-Snyder / Twiss ellipse)
has area $\pi\varepsilon$, the emittance, a conserved beam-quality
measure. The catch: if the tune hits a low-order rational
($\nu = p/q$), small magnet errors add up coherently turn after turn
and the beam is lost, a resonance stop band. The playground sweeps
the quadrupole strength and shows the stable/unstable boundary, the
tune, and the matched ellipse.

### Things to try

- Weaken the quadrupoles until $|\tfrac12\mathrm{Tr}\,M|>1$ and watch
  the motion blow up (loss of strong focusing).
- Tune the lattice and watch the betatron tune $\nu$ change; park it
  on a half-integer and watch the resonance stop band.
- Note the phase-space ellipse rotating but keeping constant area
  (emittance conservation).

### Where this comes from

The transfer-matrix formalism, the FODO stability condition, the
betatron tune and emittance follow Wiedemann, *Particle Accelerator
Physics*, Chapters 5 and 6, and Courant and Snyder, Ann. Phys. 3, 1
(1958).

## Physical setup

A circular accelerator built from identical FODO cells: a focusing quadrupole, a drift, a defocusing quadrupole, a drift (alternating-gradient strong focusing). Transverse motion in one plane is described by the phase-space vector (x, x'), propagated element by element by 2x2 transfer matrices. The ring is a periodic lattice; its one-turn matrix determines whether the betatron motion is bounded (stable) and, if so, its tune and beam ellipse. Dipoles bend the closed orbit with a radius set by the momentum and field. Lengths are in metres, momentum p in GeV/c, dipole field B in tesla, q in units of e.

## Governing equations

Element matrices: drift D(L) = [[1, L],[0, 1]]; thin lens of focal length f, [[1, 0],[-1/f, 1]] (focusing for f > 0, defocusing for f < 0). The symmetric FODO cell of length L with a centre defocusing quad (focal -f) and two half-strength focusing quads (focal 2f) is

  M_cell = QF(2f) D(L/2) QD(-f) D(L/2) QF(2f),  det(M_cell) = 1.

Stability requires |trace(M_cell)| < 2; the phase advance is cos(mu) = trace/2 and the ring tune is Q = N_cell mu / 2 pi. The periodic Courant-Snyder parameters satisfy

  M = [[cos mu + alpha sin mu, beta sin mu], [-gamma sin mu, cos mu - alpha sin mu]],  beta gamma - alpha^2 = 1.

The single-particle emittance (Courant-Snyder invariant) epsilon = gamma x^2 + 2 alpha x x' + beta x'^2 is conserved by any symplectic transport (Liouville). For dipoles, B rho = p / (0.299792458 q) (T m, p in GeV/c) and d p / d t = q v B, so the centripetal rate q v B equals p v / rho with rho = p / (0.299792458 q B).

## Numerical method

No time integration and no random numbers. Matrices are multiplied exactly; the one-turn matrix is M_cell raised to the cell count; the tune is N_cell acos(trace/2) / 2 pi; the Twiss parameters come from the periodic-matrix formulas. The beta function across one cell is obtained by transporting (beta, alpha, gamma) through sliced drifts and thin quads. The tracked particle is advanced by repeated application of the one-turn matrix; its emittance is the Courant-Snyder invariant, constant to machine precision because the map is symplectic. Deterministic; seed not applicable.

## Controls

- `f`: quadrupole focal length, 1.8 to 14 m. Sets the phase advance, the tune, the beta function and stability; below the FODO edge f = L/4 = 2.5 m the cell enters the stop band.
- `nc`: number of FODO cells, 4 to 24. Scales the ring tune Q = N_cell mu / 2 pi.
- `B`: dipole field, 0.5 to 9 T. Sets the bending radius rho = p / (0.299792458 q B); rho scales as 1/B.
- Reset, Pause/Play. Pause freezes the circulating-bunch and turn-by-turn animation.

## Expected qualitative features

- The ring with alternating F / D quads and a circulating bunch; the periodic beta function peaking at the F quad and dipping at the D quad.
- In the phase space, the tracked particle lands turn after turn on a single invariant ellipse; the emittance readout is constant.
- Driving f below 2.5 m: the ring turns red, no periodic beta solution exists, the tune is undefined and the amplitude grows without bound (the stop band).
- The stability diagram: trace(M_cell)/2 leaving the [-1, 1] band at the stop-band edge, and the tune curve crossing integer / half-integer resonance lines where a driven response diverges.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Every transfer matrix is symplectic, det = 1, to 1e-9 (one-turn) and 1e-12 (cell).
2. The stop band is exactly |trace/2| < 1 with the edge at f = L/4; just-stable and just-unstable cases bracket it; no real tune when unstable.
3. cos(2 pi Q_cell) = trace/2 and 0 < Q_cell < 1/2; phaseAdvance consistent.
4. Twiss reconstruction returns M to 1e-9 and beta gamma - alpha^2 = 1.
5. The single-particle emittance is constant over 500 turns to relative 1e-9 (Liouville).
6. Ellipse points satisfy the invariant to 1e-12 and enclose area pi*epsilon.
7. B rho = p / (0.299792458 q); rho ~ p and rho ~ 1/B; the q v B = p v / rho identity to 1e-12.
8. resonanceAmp diverges at integer / half-integer Q and is finite away; nearestResonance correct.
9. The focal-length scan brackets both stable and unstable regions consistently.
10. Determinism: identical inputs reproduce matrices, tune and tracking bit-for-bit.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Weak focusing f -> infinity: trace/2 -> 1, mu -> 0, the tune -> 0.
- Stop-band edge f = L/4: trace/2 = -1 exactly, mu -> pi, beta -> infinity.
- Symmetric cell midpoint: alpha = 0, so gamma = 1/beta and the emittance is x^2/beta + beta x'^2.
- Dipole: doubling p doubles rho; doubling B halves rho; q v B = p v / rho holds identically.

## Visual fallback

The stability diagram and the static beta function carry the physics with no animation; the circulating bunch and the turn-by-turn points are illustrative.

## Citations

- Courant, E. D. and Snyder, H. S., Theory of the Alternating-Gradient Synchrotron, Ann. Phys. 3, 1 (1958).
- Wiedemann, H., Particle Accelerator Physics, 4th ed., Springer (2015).

## Stretch goals

- Add a sextupole and show the third-integer resonance islands in phase space.
- Couple the two transverse planes and show the tune footprint.

## Risk register

- The pure linear lattice is bounded for any stable tune; the integer / half-integer instability is shown through the driven amplification factor 1/|sin(2 pi Q)| and the cell stop band, which is stated in the panel rather than implied to be a single-particle blow-up of the ideal ring.
