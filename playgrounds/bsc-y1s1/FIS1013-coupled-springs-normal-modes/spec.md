---
title: Coupled Springs and Normal Modes
slug: coupled-springs-normal-modes
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016, FIS2021]
curriculum_year: bsc-y1s1
hook: "Two carts between three springs. Push them the same way and they march in step; push them apart and they bounce against each other faster. Every possible motion is just these two patterns added together."
one_paragraph: "Two equal masses sit on a frictionless track joined by three identical springs (wall, mass, mass, wall). This is the textbook small-oscillation problem, and everything follows from diagonalising the 2x2 stiffness matrix into two normal modes: the symmetric mode (both masses move together, the middle spring never deforms, the lower frequency) and the antisymmetric mode (they move oppositely, the middle spring is doubly loaded, higher by a factor sqrt(3) here). A general start is a superposition, so the displacements show beats: energy trades between the two masses at the difference frequency. The playground draws the spring chain, the x1(t) and x2(t) traces, and a phase portrait that collapses to a straight eigen-line for a pure mode and fills a quasi-periodic orbit for a mixed one. The readout reports the two mode frequencies and the conserved energy."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Coupled springs and normal modes

## Explainer

### What you are looking at

Couple two oscillators and a generic motion looks like a mess: energy
sloshes back and forth between them. But there are exactly two
special patterns, the normal modes, in which both masses oscillate at
a single frequency. Every possible motion is just a sum of those two.
The playground lets you excite either mode or a mix and watch the
energy beat between the masses.

### The equations of motion

Two equal masses on a track joined by three identical springs (the
ends fixed) obey

$$m\ddot x_1 = -k x_1 + k (x_2 - x_1),
  \qquad
  m\ddot x_2 = -k x_2 - k (x_2 - x_1).$$

These are coupled: $x_1$ depends on $x_2$. The trick is to change
variables to combinations that decouple.

### The normal modes

Add and subtract the equations and the symmetric/antisymmetric
coordinates $x_\pm = x_1 \pm x_2$ separate into two independent
oscillators:

$$\ddot x_+ = -\frac{k}{m}\,x_+,
  \qquad
  \ddot x_- = -\frac{3k}{m}\,x_-,$$

giving the two normal-mode frequencies

$$\omega_1 = \sqrt{\frac{k}{m}}\ \ (\text{in phase}),
  \qquad
  \omega_2 = \sqrt{\frac{3k}{m}}\ \ (\text{out of phase}).$$

In mode 1 the masses move together and the middle spring never
stretches; in mode 2 they move oppositely and the middle spring works
hardest, so it is faster. Any initial condition is a superposition of
these two. Start one mass moving and you excite both modes at once;
their slightly different frequencies make the amplitude transfer
periodically from one mass to the other, the beat phenomenon, the
mechanical analogue of two coupled pendulums and of energy exchange
in molecules. The playground shows the two masses, lets you pick the
mode mix, and plots the energy in each.

### The matrix form and the eigenvalue problem

The two EoMs can be written compactly as

$$\boxed{\;m\,\ddot{\vec x} = -K\,\vec x,
       \quad
       K = k\,\begin{pmatrix} 2 & -1 \\ -1 & 2 \end{pmatrix},
       \quad
       \vec x = \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}.\;}$$

Trying $\vec x(t) = \vec e\,\cos(\omega t)$ turns Newton into an
eigenvalue problem:

$$K\,\vec e = m\,\omega^2\,\vec e.$$

The eigenvalues of $K$ are $\lambda_1 = k$ (with eigenvector
$\vec e_1 = (1, 1)/\sqrt 2$) and $\lambda_2 = 3 k$ (with eigenvector
$\vec e_2 = (1, -1)/\sqrt 2$). So

$$\omega_1 = \sqrt{\frac{k}{m}},\qquad \omega_2 = \sqrt{\frac{3 k}{m}}.$$

In mode 1 the masses move TOGETHER ($\vec e_1$) and the middle spring
never stretches, hence the low frequency $\sqrt{k/m}$. In mode 2 they
move OPPOSITELY ($\vec e_2$) and the middle spring is doubly stressed,
hence $\omega_2 = \sqrt 3 \omega_1$.

### Beats: a sum of two close modes

If only one mass is displaced initially, both modes are excited
equally. Their slightly different frequencies make the amplitude
*beat* between the masses:

$$x_1(t) = A\,\cos(\bar\omega\,t)\,\cos(\Delta\omega\,t / 2),$$

with $\bar\omega = (\omega_1 + \omega_2)/2$ and
$\Delta\omega = \omega_2 - \omega_1$. The fast carrier $\bar\omega$
is modulated by the slow envelope $\cos(\Delta\omega t / 2)$; energy
sloshes from mass 1 to mass 2 and back at period
$T_{\rm beat} = 2\pi / \Delta\omega$. This is the mechanical analogue
of two-state quantum oscillation, of the audible beat between two
mistuned guitar strings, and of mode coupling in molecules and
optical cavities.

### Symbols, at a glance

- $x_1(t)$, $x_2(t)$, mass displacements.
- $m$, identical mass; $k$, identical spring constant.
- $K$, stiffness matrix; eigenvalues are the normal-mode squared
  frequencies $m\omega^2$.
- $\vec e_1$, $\vec e_2$, the eigenvectors (the two normal modes).
- $\omega_1$, $\omega_2$, normal-mode frequencies; $\bar\omega$,
  $\Delta\omega$, their mean and difference.
- $T_{\rm beat}$, the slow modulation period.

### Things to try

- Excite the in-phase mode (push both the same way) and see a single
  clean frequency, the middle spring slack.
- Excite the out-of-phase mode (push them oppositely) and see the
  higher frequency $\sqrt 3$ times faster.
- Displace just one mass and watch the energy beat fully back and
  forth between the two (a sum of both modes).

### Bibliographic origin

The normal-mode analysis of coupled oscillators is classical: see
French, *Vibrations and Waves* (Norton 1971), Ch. 5, and Taylor,
*Classical Mechanics* (University Science 2005), Ch. 11. The matrix
formulation is in Goldstein, Poole and Safko, *Classical Mechanics*
(3rd ed., Addison-Wesley 2002), Ch. 6 (small oscillations). The
quantum analogue (two-level Rabi oscillation) is in Sakurai and
Napolitano, *Modern Quantum Mechanics* (2nd ed., Cambridge 2017),
Ch. 5.

## Physical setup

Two equal masses on a frictionless track, connected by three identical
springs to two fixed walls: wall - (k) - m - (k) - m - (k) - wall. This is
the textbook small-oscillation system; everything follows from diagonalizing
the 2 x 2 stiffness matrix.

## Governing equations

  m x1'' = -2 k x1 + k x2
  m x2'' = +k x1 - 2 k x2

Normal modes from diagonalizing the stiffness matrix:
- Symmetric: eigenvector (1, 1), frequency omega_+ = sqrt(k / m).
- Antisymmetric: eigenvector (1, -1), frequency omega_- = sqrt(3 k / m).

In units k = m = 1: omega_+ = 1, omega_- = sqrt(3) approx 1.732. The beat
frequency between modes is (omega_- - omega_+) / 2 approx 0.366.

## Numerical method

Velocity-Verlet integrator with dt = 0.01. The integrator is symplectic, so
total energy stays bounded by 1e-3 over 10^4 steps. The analytic eigenmode
decomposition is used for the side-by-side numerical-vs-analytic test.

## Controls

- + mode: launches a pure symmetric eigenmode.
- - mode: launches a pure antisymmetric eigenmode.
- generic: launches with x1(0) = 0.7, x2(0) = 0 (50/50 mix).
- speed: integrator steps per render frame, 1 to 8.

## Expected qualitative features

1. + mode: both masses oscillate together at omega_+.
2. - mode: masses oscillate exactly opposite at omega_-.
3. generic: energy sloshes between the two masses; x1(t) and x2(t) traces
   show a clear beat envelope.
4. Phase portrait (x1, x2): in eigenmodes it traces a line through the
   origin; in generic IC, traces a dense quasiperiodic Lissajous orbit
   because omega_- / omega_+ = sqrt(3) is irrational.

## Invariants and acceptance thresholds

1. Pure + mode: omega_+ exact within 1e-3; antisymmetric amplitude < 1e-3.
2. Pure - mode: omega_- exact within 1e-3; symmetric amplitude < 1e-3.
3. Velocity-Verlet energy drift |delta E / E_0| < 1e-3 over 10^4 steps.
4. Eigenfrequencies match analytic expressions to 1e-12.
5. Numerical state vs analytic decomposition: agreement within 1e-3 at t = 2.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- k_coupling = 0: omega_+ = omega_- (degeneracy); no beats.
- Generic IC: state expressible as A_+ e_+ + A_- e_-, oscillates at both
  frequencies independently.

## Visual fallback

Canvas2D only. Top panel shows the mechanical scene (springs as zigzags);
lower-left panel shows x1(t), x2(t) traces; lower-right shows the (x1, x2)
phase portrait.

## Citations

- Goldstein, Poole, Safko 2001, Classical Mechanics 3e, Ch. 6 (`goldstein2001`).
- Marion and Thornton, Classical Dynamics 5e, Ch. 12 (alternate cite).

## Stretch goals

- Three or more masses; show the chain dispersion relation.
- Coupling-strength slider that breaks the k = m assumption.
- Animate eigenmode arrows on the phase portrait.

## Risk register

- For dt = 0.01, velocity-Verlet drift is fine but the eigenmode test
  requires N period at exactly 2 pi / omega; if dt does not divide that
  cleanly, the test must allow a small tolerance.
