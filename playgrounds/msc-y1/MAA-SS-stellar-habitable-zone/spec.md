---
title: "Stellar Habitable Zone"
slug: stellar-habitable-zone
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-SS
primary_citation: kippenhahn-weigert
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Move a planet between the inner and outer habitable-zone edges; the surface goes ice, ocean, or steam depending on equilibrium temperature.'
one_paragraph: 'T_eq from L_star, albedo, and orbital radius; HZ band traced for T in [200, 273] K. Drag the planet, change Teff or albedo, and watch the surface state.'
tags: [stellar, animation, multi-panel, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [Teff, a]
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
  - "Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, Second ed."
---

# Stellar Habitable Zone

Move a planet between the inner and outer edges of the conservative HZ for a given star (T_eff, L). The planet surface displays ice (frozen), blue-green (liquid water), or steam (runaway) based on its equilibrium temperature with a fixed albedo.

## Explainer

### What you are looking at

Slide a planet inward and it bakes; slide it outward and it freezes.
The narrow band where it can hold liquid water is the habitable zone.
The playground sets the star and lets you drag the planet, the surface
switching between ice, ocean, and steam as its temperature crosses the
thresholds.

### Equilibrium temperature

Balance absorbed starlight against thermal re-emission (blackbody). For
a planet of Bond albedo $A$ at distance $a$ from a star of temperature
$T_\star$ and radius $R_\star$,

$$T_\text{eq} = T_\star\sqrt{\frac{R_\star}{2a}}\,(1 - A)^{1/4}.$$

Equivalently, the incident flux falls as $S(a) = L_\star/(4\pi a^2)$,
so $T_\text{eq}\propto a^{-1/2}$: move twice as far out and the
equilibrium temperature drops by $\sqrt2$.

### The zone edges

The conservative habitable zone is bounded by climate physics, not
just the bare blackbody number:

- Inner edge ($\sim$ runaway greenhouse): too much flux and the oceans
  evaporate, water vapor (a greenhouse gas) amplifies the heating, and
  the planet runs away to a Venus-like steam state.
- Outer edge ($\sim$ maximum greenhouse): too little flux and even a
  thick CO2 atmosphere cannot keep the surface above freezing.

In between, a planet with modest greenhouse warming sits above 273 K
and holds liquid water. Because the zone scales with $\sqrt{L_\star}$,
a luminous star pushes it outward and a faint red dwarf pulls it in
very close. The playground shows the planet's state flip at the edges
as you move it and change the star.

### Things to try

- Move the planet inward until the surface turns to steam (the
  runaway-greenhouse inner edge).
- Move it outward until it freezes (the maximum-greenhouse outer
  edge).
- Brighten the star and watch the whole habitable band shift outward
  ($\propto\sqrt{L_\star}$).

### Where this comes from

The equilibrium-temperature balance and the runaway / maximum-
greenhouse zone edges follow Kasting, Whitmire and Reynolds (1993) and
Catling and Kasting, *Atmospheric Evolution on Inhabited and Lifeless
Worlds*.

## Physical setup

* T_eq = T_star sqrt(R_star / 2 a) (1 - A)^0.25 with A = 0.3 albedo.
* HZ inner edge: ~ 273 K + greenhouse offset.
* HZ outer edge: ~ 200 K maximum greenhouse.

## Citations

- Carroll & Ostlie, An Introduction to Modern Astrophysics, 2nd ed., Ch. 28: The Search for Life.
