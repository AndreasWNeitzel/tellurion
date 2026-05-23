---
title: "Gravity Assist Slingshot"
slug: gravity-assist-slingshot
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: FIS1013
supporting_ucs: [MAA-SS]
curriculum_year: bsc-y1s1
hook: 'A spacecraft skims past a planet on a hyperbola; the planet rest frame conserves speed, the solar-system frame does not.'
one_paragraph: 'Hyperbolic flyby with turning angle delta = 2 arcsin(1 / (1 + r_min v_inf^2 / GM)). Solar-system delta-v emerges from vector addition with the planet velocity; presets reproduce Voyager 1 at Jupiter and Cassini at Venus to within 20%.'
tags: [mechanics, interactive-drag, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
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
---

# Gravity Assist Slingshot

A Jupiter-scale planet orbits a central star. A spacecraft enters on a hyperbolic trajectory; the user drags the periapsis distance and the relative approach angle. Inset shows the symmetric hyperbola in the planet rest frame; main panel shows the asymmetric solar-system-frame trajectory. Velocity arrows before and after make the energy change explicit. Presets load Voyager 1 at Jupiter, Cassini at Venus, BepiColombo.

## Explainer

### What you are looking at

A spacecraft can speed up by flying past a planet without using any
fuel. It looks like getting energy from nothing, until you realize
the planet is moving. The playground shows the same flyby in two
frames: in the planet's frame the spacecraft just turns (same speed
in, same speed out); in the Sun's frame it leaves faster, having
stolen a sliver of the planet's orbital motion.

### The flyby in the planet's frame

Relative to the planet the spacecraft is on a hyperbolic orbit. It
comes in at speed $v_\infty$, whips around periapsis, and leaves at
the same speed $v_\infty$ but deflected by an angle $\delta$ set by
how close it passes:

$$\sin\frac{\delta}{2} = \frac{1}{1 + r_p v_\infty^2 / (G M_p)}.$$

Energy relative to the planet is unchanged: a closer periapsis just
bends the path more.

### Why the Sun's frame gains energy

Transform back by adding the planet's orbital velocity
$\mathbf U$. The spacecraft's heliocentric speed changes because its
velocity vector was rotated by $\delta$ while $\mathbf U$ stayed
fixed:

$$\mathbf v_\mathrm{out} = \mathbf v_\infty' + \mathbf U,
  \qquad
  |\mathbf v_\mathrm{out}|^2
  = v_\infty^2 + U^2 + 2\,v_\infty U\cos(\dots),$$

so a trailing-side pass (turning the spacecraft toward the planet's
direction of motion) can add up to $2U$ to its heliocentric speed.
Energy and momentum are still conserved overall: the spacecraft gains
exactly what the planet loses, but the planet is $\sim10^{20}$ times
more massive so its orbit is unmeasurably slowed. This is how
Voyager reached the outer planets and how Cassini and BepiColombo
shed or gained speed for free. The playground lets you drag the
periapsis and approach geometry and shows the deflection, the
before/after velocity arrows, and the heliocentric speed change.

### Things to try

- Lower the periapsis distance and watch the deflection $\delta$ and
  the speed boost grow.
- Flip to a leading-side pass and watch the flyby slow the craft
  down (used to drop probes inward, like BepiColombo at Mercury).
- Compare the two panels: symmetric hyperbola in the planet frame,
  asymmetric speed-up in the Sun frame.

### Where this comes from

The hyperbolic-flyby deflection and the frame transformation that
yields the gravity assist follow Curtis, *Orbital Mechanics for
Engineering Students*, Chapter 8, and Bate, Mueller and White,
*Fundamentals of Astrodynamics*.

## Physical setup

Hyperbolic encounter in the planet frame, turning angle $\delta = 2 \arcsin(1/(1 + r_\min v_\infty^2 / GM_P))$. Exit in the solar system frame:
$$\mathbf{v}_\mathrm{after} = \mathbf{v}_\mathrm{before} + \mathbf{v}_P \cdot (\hat{e}_\mathrm{exit} - \hat{e}_\mathrm{entry})$$

## Controls

- Periapsis-distance slider, approach-angle slider
- Preset gravity assists with documented historical $\Delta v$

## Invariants

- Planet rest frame: $|\mathbf{v}_\mathrm{entry}| = |\mathbf{v}_\mathrm{exit}|$ within 0.01%.
- Solar system frame energy change: $\Delta E = m \mathbf{v}_P \cdot (\mathbf{v}_\mathrm{exit} - \mathbf{v}_\mathrm{entry})$ within 1%.
- Trailing pass (entry angle in $(0, \pi/2)$ behind planet): $\Delta v > 0$.

## Citations

Bate, Mueller, White, "Fundamentals of Astrodynamics" ch. 8.
