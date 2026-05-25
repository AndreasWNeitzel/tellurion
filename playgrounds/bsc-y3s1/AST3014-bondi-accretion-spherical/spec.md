---
title: Bondi Spherical Accretion
slug: bondi-accretion-spherical
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: frank-king-raine
primary_chapter: 2
hook: 'A star sitting in gas pulls it inward; the flow goes transonic at one special radius and the accretion rate is fixed by the gas density and sound speed alone.'
one_paragraph: 'Bondi accretion is the steady, spherically symmetric inflow of gas onto a point mass. Far out the gas is nearly at rest; gravity pulls it in, it speeds up, and at the sonic radius (about half the Bondi radius r_B = GM/c_s^2) the flow crosses from subsonic to supersonic. The steady mass accretion rate is then set entirely by the ambient density and sound speed, Mdot proportional to rho_inf (GM)^2 / c_s^3, with no free parameters once the gas state is fixed. The playground sweeps the central mass and shows the density and velocity profiles with the sonic point marked. It is the baseline model for accretion onto compact objects and stars. Reference: Frank, King and Raine, Accretion Power in Astrophysics, Ch. 2.'
tags: [fluids-mhd, stellar, animation, live-readout]
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
  - "Frank, King, Raine, Accretion Power in Astrophysics, Third ed., Ch. 2."
---
# Bondi spherical accretion
Bondi radius and accretion rate for a steady spherically symmetric inflow; sonic point at $r_B/2$. Source: Frank-King-Raine Ch. 2.

## Explainer

### What you are looking at

A compact object (a black hole, a neutron star, a young star) sitting
in a cloud of gas pulls that gas in. Far away the gas barely moves;
close in it falls supersonically. There is exactly one steady flow that
threads both regimes, and its accretion rate is fixed by just the gas
density and temperature. This is Bondi accretion, the baseline model
for how compact objects feed.

### The setup

A point mass $M$ in uniform gas of density $\rho_\infty$ and sound
speed $c_s$. Steady, spherically symmetric inflow conserves mass
($\dot M = 4\pi r^2\rho u = \text{const}$) and momentum (Euler). The
natural length is the Bondi radius, where gravity wins over thermal
pressure:

$$r_B = \frac{GM}{c_s^2}.$$

### The sonic point and the rate

Combining mass and momentum conservation gives a wind-type equation
that is singular where the flow speed equals the sound speed. The
unique physical (transonic) solution passes through $u = c_s$ at the
sonic radius

$$r_s = \frac{r_B}{2} = \frac{GM}{2 c_s^2},$$

subsonic outside, supersonic inside. The steady accretion rate that
results depends only on the ambient gas, not on any inner boundary:

$$\dot M \;\sim\; \frac{\rho_\infty\,(GM)^2}{c_s^3}.$$

So a colder cloud (small $c_s$) is accreted far more vigorously
($\dot M\propto c_s^{-3}$), and the rate scales as $M^2$. The
playground sweeps the central mass and shows the density and velocity
profiles with the sonic point marked, and the rate tracking
$\rho_\infty(GM)^2/c_s^3$.

### Things to try

- Increase $M$ and watch the Bondi and sonic radii grow and the
  accretion rate climb as $M^2$.
- Lower the gas temperature (sound speed) and watch the rate shoot up
  ($c_s^{-3}$).
- Note the flow always crosses sound speed at $r_B/2$: the transonic
  point is forced.

### Where this comes from

The Bondi radius, the transonic sonic point at $r_B/2$, and the
$\dot M \propto \rho_\infty (GM)^2/c_s^3$ accretion rate follow Frank,
King and Raine, *Accretion Power in Astrophysics*, Chapter 2 (after
Bondi 1952).
