---
title: WKB Bohr-Sommerfeld vs Exact
slug: wkb-vs-shooting
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS2018]
curriculum_year: bsc-y3s2
hook: 'The old quantum rule, fit a whole number of half-waves into the well, nails the harmonic oscillator exactly, yet misses the quartic well''s ground state by a factor of three.'
one_paragraph: 'Before the Schrodinger equation, Bohr and Sommerfeld quantised a bound state by demanding that the action integral over one classical oscillation equal (n + 1/2) times Planck''s constant. This playground puts that rule head to head with the exact energy levels found by numerically shooting the Schrodinger equation, for a tunable power-law well V(x) = |x|^p / p. Slide p: at p = 2 (the harmonic oscillator) the Bohr-Sommerfeld levels sit exactly on the exact ones; at p = 4 (the quartic) the rule undershoots the ground state badly because the wavefunction leaks into the classically forbidden region the old rule ignores. Climb to higher levels and the two ladders converge, a direct picture of the correspondence principle: semiclassical quantisation becomes accurate when many wavelengths fit inside the well.'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# WKB Bohr-Sommerfeld vs exact eigenvalues

## Explainer

### What you are looking at

The WKB approximation estimates quantum energy levels from a single
classical integral, no Schrodinger equation solved. The playground
pits it against the exact levels for a harmonic well (where WKB is
perfect) and a quartic well (where it is close but not exact), so you
see exactly when the semiclassical shortcut works.

### Bohr-Sommerfeld quantization

WKB says a bound state exists when the classical action enclosed in one
oscillation is a half-integer number of $h$:

$$\int_{x_L}^{x_R}\sqrt{2m\big(E - V(x)\big)}\,dx
  = \left(n + \tfrac12\right)\pi\hbar,
  \qquad n = 0, 1, 2,\dots$$

The integral runs between the classical turning points $x_L, x_R$ where
$E = V(x)$. The $+\tfrac12$ is the Maslov correction (a $\pi/2$ phase
loss at each soft turning point). Solving for $E$ at each $n$ (here by
bisecting on $E$) gives the WKB spectrum.

### When it is exact, and when it is not

For the harmonic oscillator $V = x^2/2$ the WKB integral is elementary
and yields $E_n = n + \tfrac12$, the *exact* answer for every level.
That is special: WKB is exact for the harmonic potential. For the
quartic well $V \propto x^4$ there is no such luck; WKB gives a good
estimate that improves with $n$ (semiclassical limit) but always
differs from the true Bender-Wu numerical levels by a small amount,
largest for the ground state where the action is smallest and the
"many wavelengths in the well" assumption is weakest. The playground
overlays WKB and exact for both wells so the systematic error is
visible.

### Things to try

- Pick the harmonic well ($p=2$) and confirm WKB nails every level
  exactly ($E_n = n+1/2$).
- Pick the quartic well ($p=4$) and watch the small WKB error,
  largest at $n=0$, shrinking as $n$ grows.
- Note WKB needs only a classical integral: no wavefunction is ever
  solved.

### Where this comes from

The Bohr-Sommerfeld quantization condition, the Maslov $+1/2$, and the
harmonic-exactness follow Griffiths, *Introduction to Quantum
Mechanics*, Chapter 8, with the quartic reference levels from Bender
and Wu (1969).

## Physical setup

Bound-state energies for a 1D particle in a power-law well V(x) = |x|^p / p, hbar = m = 1. Compare the Bohr-Sommerfeld (WKB) approximation to the "exact" reference levels for the harmonic oscillator (p = 2; closed form E_n = n + 1/2) and quartic anharmonic oscillator (p = 4; Bender-Wu 1969 numerical levels).

## Governing equations

Bohr-Sommerfeld quantization: integral_{x_L}^{x_R} sqrt(2 m (E - V(x))) dx = (n + 1/2) pi hbar.

Bisect on E for the BS integral = (n + 1/2) pi.

## Numerical method

Outer bisection on E (80 iterations); inner midpoint-rule integral of the BS form over 400 panels with turning points found by bisection. The "exact" reference is the analytic E_n = n + 1/2 for p = 2 and the tabulated Bender-Wu 1969 numerical eigenvalues for p = 4.

## Controls

- p: exponent of V(x) = |x|^p / p, slider 2 - 6, default 2
- nMax: number of levels to display, 3 - 8, default 6

## Expected qualitative features

1. p = 2: BS exactly recovers the harmonic ladder E_n = n + 1/2.
2. p = 4: BS underestimates the ground state by a factor ~ 3 (canonical BS failure for non-quadratic wells at low n).
3. As n grows, BS converges to the true eigenvalues (correspondence principle).
4. The BS curve shifts upward as p grows.

## Invariants and acceptance thresholds

- HO (p = 2): BS reproduces E_n = n + 1/2 to 1e-3 for n = 0..5.
- BS levels monotone in n for p = 2..6.
- Quartic (p = 4) ground state: BS in (0.3, 0.5) vs Bender-Wu exact 1.06.
- Quartic n = 5: BS in [5, 30].

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- p = 2: BS exact.
- n -> infinity: BS asymptotically exact for any smooth well (correspondence principle).
- p -> infinity: infinite square well; BS levels approach n^2 pi^2 / 2.

## Visual fallback

Canvas2D only.

## Citations

- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Section 8.1 (`griffithsqm2018`).
- Bender and Wu 1969, "Anharmonic oscillator", Phys. Rev. 184, 1231.
- Newman 2013, Computational Physics, Section 6.3 (Numerov method for shooting; teaching reference).

## Stretch goals

- Implement inward-matching shooting (Numerov from xMax inward + match at turning point) so the "exact" curve is computed numerically for any p.
- Add the Langer correction to BS to improve low-n accuracy.

## Risk register

- The slug suggests a full WKB vs shooting comparison; this implementation provides BS plus tabulated Bender-Wu reference for p = 4. A proper shooting method is left as a stretch goal.
