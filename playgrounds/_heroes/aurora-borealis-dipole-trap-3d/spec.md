---
title: Aurora Borealis - Charged Particles in Earth's Dipole (Hero)
slug: aurora-borealis-dipole-trap-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS2013
supporting_ucs: [AST3017]
curriculum_year: hero
primary_citation: stormer1955
primary_chapter: 1
hero_candidate: true
hook: 'Solar-wind protons slam into Earth''s dipole field, spiral along the lines, mirror back and forth, and where they dip below 600 km they excite oxygen to glow green: the aurora.'
one_paragraph: 'A magnetic dipole field traps charged particles by the magnetic mirror effect: each particle gyrates around a field line and bounces between two turning points where the field is strongest. The playground integrates the Lorentz force F = q v x B with a Boris pusher (symplectic, conserves |v| exactly) on solar-wind-injected particles, and lights up the auroral oval whenever a particle dips below 600 km altitude near a pole. The signature green oxygen line at 558 nm dominates the lower aurora (100-300 km); the red 630 nm line dominates above 300 km. References: Stormer, The Polar Aurora, Oxford 1955; Kivelson and Russell, Introduction to Space Physics.'
caption: 'Figure 1. Charged particles spiraling along Earth''s dipole field lines, lighting up the auroral oval where they hit the upper atmosphere. Method: Boris pusher (symplectic Lorentz integration), dipole field B = (3 (m.r) r - r^2 m) / r^5 in code units, atmospheric excitation triggered below 600 km at magnetic latitudes above 50 degrees. Source: Stormer, The Polar Aurora, Oxford 1955.'
tags: [electromagnetism, stellar, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [seed]
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

# Aurora borealis
Dipole magnetic trap + Boris pusher. Source: Stormer, The Polar Aurora, Oxford 1955.

## Explainer

### What you are looking at

Earth's magnetic field is a dipole: think of a bar magnet inside the
planet with one end near each geographic pole. Charged particles
streaming in from the solar wind hit this dipole and get trapped
because of how the Lorentz force $\vec F = q\vec v \times \vec B$
turns their velocity. Each particle ends up gyrating tightly around
a field line while bouncing back and forth along it (the magnetic
mirror effect). The aurora lights up where these particles finally
hit the upper atmosphere, around 100 to 600 km altitude near the
magnetic poles, exciting oxygen atoms to emit the 558 nm green line
and the 630 nm red line.

### The dipole field

A magnetic dipole at the origin with moment $\vec m = m\hat z$ has
field

$$\vec B(\vec r) \;=\; \frac{\mu_0}{4\pi}\,
  \frac{3(\vec m \cdot \vec r)\,\hat r - \vec m\,r^2}{r^5}.$$

Field strength scales as $1/r^3$, so the field is strongest near the
poles (close to Earth) and weakest at the equator far out. That is
what creates the mirror points: as a gyrating particle moves toward
a pole, $|B|$ rises, and conservation of the adiabatic invariant
$\mu = mv_\perp^2 / 2B$ forces $v_\perp$ up. Once $v_\perp^2$ equals
the total $v^2$, the parallel velocity has gone to zero and the
particle reflects back.

### The Boris pusher

The Lorentz force on a charged particle has no work component
($\vec F \cdot \vec v = 0$), so $|\vec v|$ is exactly conserved.
The Boris pusher achieves the same numerical conservation by
splitting each step into half-step drift, exact rotation of $\vec v$
about $\vec B$, and a second half-step drift. The rotation angle
per step is

$$\theta \;=\; \frac{q}{m}\,|\vec B|\,\Delta t,$$

and the rotation uses the half-angle tangent vector $\vec t =
(q/m) \vec B \Delta t / 2$. This is symplectic and stable for any
$\Delta t \lesssim 1/\omega_c$ where $\omega_c = qB/m$ is the
cyclotron frequency.

### Where the colors come from

Solar-wind protons (or electrons) deposit their energy in the upper
atmosphere by collisional excitation of O and N. The dominant
emission lines are

- **Oxygen 558 nm (green)**: the metastable $^1S_0 \to {}^1D_2$
  transition at altitudes 100 to 250 km.
- **Oxygen 630 nm (red)**: the $^1D_2 \to {}^3P_2$ transition at
  altitudes 250 to 600 km; the metastable state is so long-lived (110 s)
  that it can only emit at high altitude where collisional quenching
  is rare.
- Blue/purple emissions are from $N_2^+$ at lower altitudes (not
  rendered here).

In the playground the color of the aurora swatch tracks the altitude
where the particle deposits its energy: green for the lower band,
red for the upper.

### Symbols

- $\vec B$: magnetic field vector.
- $\vec m = m \hat z$: Earth's dipole moment, aligned with the
  geographic (and approximately magnetic) axis.
- $q, m$: particle charge and mass.
- $\vec v_\parallel$, $\vec v_\perp$: velocity components parallel
  and perpendicular to $\vec B$.
- $\omega_c = qB/m$: cyclotron frequency.
- $\mu = mv_\perp^2 / 2B$: first adiabatic invariant (magnetic moment).

### Where this comes from

The dipole-trapped motion of charged particles is the subject of
Carl Stormer's 1955 monograph, *The Polar Aurora*; modern derivations
of the adiabatic invariants are in Kivelson and Russell, *Introduction
to Space Physics*, Ch. 8. The Boris pusher is from Boris, *Proc. 4th
Conf. on Numerical Simulation of Plasmas*, 1970, p. 3.
