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
---

# Gravity Assist Slingshot

A Jupiter-scale planet orbits a central star. A spacecraft enters on a hyperbolic trajectory; the user drags the periapsis distance and the relative approach angle. Inset shows the symmetric hyperbola in the planet rest frame; main panel shows the asymmetric solar-system-frame trajectory. Velocity arrows before and after make the energy change explicit. Presets load Voyager 1 at Jupiter, Cassini at Venus, BepiColombo.

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

Bate, Mueller, White, "Fundamentals of Astrodynamics" ch. 8 (`bmw1971`).
