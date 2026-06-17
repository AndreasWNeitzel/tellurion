---
title: Kronig-Penney Band Structure
slug: kronig-penney-bands
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
primary_citation: kittel-cm
supporting_ucs: [FIS3020]
curriculum_year: bsc-y3s2
hook: 'Line up identical potential spikes in a row and the electron''s allowed energies split into bands separated by forbidden gaps: where insulators, metals, and semiconductors come from.'
one_paragraph: 'The Kronig-Penney model is the simplest crystal: a periodic row of delta-function potential spikes. Requiring a traveling Bloch wave forces the condition cos(ka) = cos(qa) + (P/qa) sin(qa). Wherever the right side stays within [-1, 1] a real wavevector k exists and the energy is allowed; wherever it exceeds 1 in magnitude there is no propagating state and the energy lies in a band gap. The playground sweeps the spike strength P and draws the bands narrowing and the gaps widening. This band-gap structure is the entire basis for why solids are metals, insulators, or semiconductors. Reference: Kittel, Introduction to Solid State Physics, Ch. 7.'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
references:
  - "Chen, Introduction to Plasma Physics and Controlled Fusion, 2nd ed."
---

# Kronig-Penney band structure

## Explainer

### What you are looking at

A crystal is a periodic potential. Solve the Schrodinger equation in
one and the allowed electron energies are not a continuum and not
sharp atomic levels: they clump into bands separated by forbidden
gaps. The Kronig-Penney model gets this with the simplest possible
periodic potential, a row of delta spikes, and the playground shows
the bands open and the gaps widen as you turn up the spike strength.

### The model and its condition

Periodic delta spikes of dimensionless strength $P$ at spacing $a$.
Demanding a valid Bloch wave (a plane wave times a periodic part)
yields one transcendental condition:

$$\cos(ka) = \cos(qa) + \frac{P}{qa}\sin(qa),
  \qquad q = \frac{\sqrt{2mE}}{\hbar}.$$

Call the right-hand side $f(qa)$. Since the left side is $\cos(ka)$, a
real crystal wavevector $k$ exists only where

$$-1 \le f(qa) \le 1.$$

### Bands and gaps fall straight out

Sweep the energy (equivalently $qa$). Wherever $f(qa)$ stays within
$[-1, 1]$ there is a propagating Bloch state: an allowed band.
Wherever $|f(qa)| > 1$ no real $k$ solves the equation: a forbidden
band gap, energies an electron in the crystal simply cannot have.
Stronger spikes (larger $P$) push $f$ further outside $[\pm1]$, so the
allowed bands narrow and the gaps widen; as $P\to0$ the gaps close and
you recover the free-electron parabola. This single picture, allowed
bands and forbidden gaps from periodicity, is why some solids are
metals (partly filled band), insulators (filled band below a big gap),
and semiconductors (small gap). The playground draws $f(qa)$ with the
$\pm1$ rails and the resulting $\varepsilon(ka)$ band structure.

### Things to try

- Start with small $P$ and watch nearly-free-electron bands with tiny
  gaps at the zone boundaries.
- Increase $P$ and watch the gaps widen and the bands flatten toward
  atomic-like levels.
- Read the $f(qa)$ curve: every excursion outside $[-1,1]$ is a gap.

### Where this comes from

The Kronig-Penney delta-comb model, the Bloch condition, and the
allowed-band/forbidden-gap criterion follow Kittel, *Introduction to
Solid State Physics*, Chapter 7, and Ashcroft and Mermin, *Solid State
Physics*, Chapter 8.

## Physical setup

A 1D crystal with delta-function spikes on a periodic lattice (period a, dimensionless strength P). The energy spectrum splits into allowed bands and forbidden gaps. The simplest textbook model in solid-state physics that produces a band structure.

## Governing equations

  cos(k a) = cos(q a) + (P / q a) sin(q a),  q = sqrt(2 m E) / hbar.

In dimensionless form with hbar^2 / (2 m a^2) = 1, the energy is epsilon = (q a)^2.

f(qa) = cos(qa) + (P / qa) sin(qa) must lie in [-1, +1] for a real Bloch wave-vector k a to exist. Otherwise the energy is in a band gap.

## Numerical method

Sample f(qa) on a 4000-point uniform epsilon grid. Locate boundaries of allowed bands by sign-change in (|f| - 1). Refine each boundary to machine precision by bisection. Build dispersion curves epsilon(ka) inside each band using k a = arccos f.

## Controls

- P (strength): dimensionless lattice strength, 0.5 - 20, default 4.0
- eps max: maximum displayed energy, 20 - 120, default 60

## Expected qualitative features

1. P = 0: no periodic potential; f reduces to cos(qa); all energies allowed.
2. Small P: narrow gaps open at qa = pi, 2 pi (Brillouin zone boundaries).
3. Large P: gaps widen, bands narrow; in the tight-binding limit the bands flatten.

## Invariants and acceptance thresholds

- f(0, P) = 1 + P exact.
- f(pi, P) = -1 exact.
- P = 0: total allowed-band length > 95 percent of eps range.
- P = 12: at least 3 distinct bands in [0, 80].
- Band edges satisfy |f| = 1 within 0.02.
- Inside a gap, kaForEnergy returns NaN.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- P -> 0: free-electron parabola, no gaps.
- P -> infinity: tight-binding limit, very narrow bands centered on the free-atom levels.
- qa = n pi (Brillouin boundaries): f = +/- 1, on the band edge.

## Visual fallback

Canvas2D only.

## Citations

- Shankar 1994, Principles of Quantum Mechanics, 2e, Section 19.3.
- Ashcroft and Mermin 1976, Solid State Physics, Chapter 8.
- Sakurai and Napolitano 2017, Modern QM 3e, Section 5.7.

## Stretch goals

- Add a finite-well "Kronig-Penney with square barriers" toggle (more realistic than delta combs).
- Add a density-of-states plot derived from the dispersion.
- Add a chemical-potential cursor that highlights which bands are occupied.

## Risk register

- For very large P (> 30) the recurrence-based dispersion sampling can miss narrow bands; the slider is capped at 20.
- Below P = 0.5 the gaps are very narrow and the bisection might land on either side of the boundary; visually unaffected.
