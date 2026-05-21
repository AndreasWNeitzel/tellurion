---
title: "Slow-Roll Inflation: Ball on the Potential"
slug: slow-roll-inflation
status: superseded
superseded_by: inflation-quantum-fluctuations
audience: portfolio
created: 2026-05-15
primary_uc: MAA-CO
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A golden ball rolls down V(phi) under Hubble friction; the slow-roll parameters epsilon and eta produce a point on the (n_s, r) plane.'
one_paragraph: 'Inflaton EOM with Hubble friction; epsilon = (V_phi/V)^2/2 and eta = V_phi_phi/V; observables n_s = 1 - 6 epsilon + 2 eta and r = 16 epsilon plotted on a Planck-style plane.'
tags: [galactic, animation, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [model]
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

# Slow-Roll Inflation: Ball on the Potential

A golden ball rolls down an inflaton potential V(phi) under Hubble friction. Slow-roll parameters epsilon(phi) and eta(phi) computed live; n_s and r plotted on a Planck-style n_s-r plane.

## Explainer

### What you are looking at

The leading explanation for why the early universe expanded
explosively is that it was briefly dominated by a scalar field, the
inflaton, slowly rolling down a nearly flat potential while gravity
acts like molasses. The playground is literally that picture: a ball
rolling on $V(\phi)$ under Hubble friction, with the two numbers a
real CMB experiment measures plotted live.

### The rolling field

The inflaton obeys a damped equation, like a ball in syrup, where the
expansion rate $H$ provides the friction:

$$\ddot\phi + 3H\dot\phi + V'(\phi) = 0,
  \qquad
  H^2 = \frac{1}{3M_\mathrm{Pl}^2}
  \left[\tfrac12\dot\phi^2 + V(\phi)\right].$$

When the potential is flat enough the friction term dominates the
acceleration ($\ddot\phi$ negligible), the field creeps ("slow
roll"), the energy is almost pure potential, and the universe
inflates quasi-exponentially.

### The slow-roll parameters

How flat "flat enough" is is captured by two dimensionless numbers
built from the shape of $V$:

$$\epsilon(\phi) = \frac{M_\mathrm{Pl}^2}{2}
  \left(\frac{V'}{V}\right)^2,
  \qquad
  \eta(\phi) = M_\mathrm{Pl}^2\,\frac{V''}{V}.$$

Inflation happens while $\epsilon \ll 1$ and ends when
$\epsilon \approx 1$ (the ball reaches the steep part). The number of
e-folds of expansion is $N = \int (1/\sqrt{2\epsilon})\,d\phi/
M_\mathrm{Pl}$, and about 50 to 60 are needed to solve the horizon
and flatness problems.

### What the CMB measures

Quantum fluctuations of $\phi$ get stretched to cosmic scales and
seed the CMB anisotropies. To leading order the scalar spectral tilt
and the tensor-to-scalar ratio are

$$n_s = 1 - 6\epsilon + 2\eta,
  \qquad
  r = 16\,\epsilon,$$

evaluated when observable scales left the horizon. These are exactly
the axes of the Planck $n_s$-$r$ constraint plot, so different
potentials trace different points and some inflation models are
already ruled out. The playground rolls the ball on a choice of
$V(\phi)$, computes $\epsilon,\eta$ live, and drops the predicted
$(n_s,r)$ onto the Planck plane.

### Things to try

- Watch the ball creep on the flat part (slow roll, $\epsilon\ll1$)
  then accelerate and end inflation as $\epsilon\to1$.
- Change the potential shape and watch the predicted point move on
  the $n_s$-$r$ plane, in or out of the Planck-allowed region.
- Note that a steeper potential gives larger $r$ (more primordial
  gravitational waves).

### Where this comes from

The slow-roll equations, the $\epsilon,\eta$ parameters, and the
$n_s$-$r$ predictions follow Baumann, *Cosmology* (2022), and the
observational plane of Planck 2018 (Akrami et al., A&A 641, A10).

## Physical setup

* Inflaton EOM: phi_dd + 3 H phi_d + V_phi = 0 with H^2 = V / (3 M_Pl^2).
* Slow-roll: epsilon = (M_Pl V_phi / V)^2 / 2, eta = M_Pl^2 V_phi_phi / V.
* Observables: n_s = 1 - 6 epsilon + 2 eta, r = 16 epsilon.

## Models

* V = 1/2 m^2 phi^2 (chaotic quadratic)
* V = lambda phi^4 / 4
* V = V_0 (1 - exp(-sqrt(2/3) phi / M_Pl))^2 (Starobinsky-like)
