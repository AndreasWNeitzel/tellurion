---
title: Stellar Habitable Zone
slug: habitable-zone-stellar-flux
status: superseded
superseded_by: stellar-habitable-zone
audience: portfolio
created: 2026-05-13
primary_uc: MAA-AB
supporting_ucs: [AST2004]
curriculum_year: msc-y1
primary_citation: carroll-ostlie
primary_chapter: 7
hook: 'Too close and the oceans boil, too far and they freeze; the habitable zone is the orbital band where a planet could keep liquid water.'
one_paragraph: 'A star''s luminosity follows from Stefan-Boltzmann, L = 4 pi R^2 sigma T_eff^4, and the flux on a planet falls as S(d) = L / (4 pi d^2). The habitable zone is the range of orbital distances where that flux keeps a planet between a runaway greenhouse at the inner edge (about 1.37 solar constants) and a maximum greenhouse at the outer edge (about 0.35). The playground sweeps the star''s temperature and radius and shows the zone shifting: hotter, larger stars push it outward. It is the first-cut filter for where to search for life. Reference: Kasting, Whitmire and Reynolds 1993.'
tags: [exoplanets, animation, live-readout]
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
---

# Stellar habitable zone

## Explainer

### What you are looking at

The habitable zone is the ring of orbits around a star where a
rocky planet could hold liquid water: close enough not to freeze,
far enough not to boil. The playground sets the star's luminosity
and shows the zone move in and out, with the key surprise that it is
not fixed in absolute distance but scales with the square root of the
star's brightness.

### Equilibrium temperature

A planet absorbs starlight and re-radiates as a blackbody. Balancing
absorbed against emitted power gives the equilibrium temperature

$$T_\mathrm{eq} = \left[\frac{L_*\,(1-A)}
  {16\pi\sigma\,d^2}\right]^{1/4},$$

with $L_*$ the stellar luminosity, $A$ the planet's albedo (fraction
reflected), $\sigma$ the Stefan-Boltzmann constant, and $d$ the
orbital distance. The crucial scaling is $T_\mathrm{eq}\propto
(L_*/d^2)^{1/4}$: temperature depends on the received flux, not on
distance alone.

### Where the zone sits, and why it moves

Setting $T_\mathrm{eq}$ to the inner (runaway-greenhouse) and outer
(maximum-greenhouse) limits and solving for $d$ gives the zone
boundaries. Since the flux at the planet is $L_*/(4\pi d^2)$,
constant-temperature edges sit at

$$d_\mathrm{in,out} \;\propto\; \sqrt{\,L_*\,}.$$

So a star ten times more luminous pushes the habitable zone roughly
three times farther out, and the zone for a faint M dwarf hugs the
star tightly (where tidal locking and flares then matter). The
playground sweeps $L_*$ and the planet's albedo and shows the green
annulus expanding and contracting as $\sqrt{L_*}$, with Earth marked
for reference. (The simple radiative-equilibrium estimate ignores
atmospheric greenhouse warming, which is why Earth at $T_\mathrm{eq}
\approx 255$ K is habitable at a true surface 288 K.)

### Things to try

- Increase the luminosity and watch the zone move outward as the
  square root, not linearly.
- Raise the albedo (a more reflective planet) and watch the whole
  zone shift inward (less absorbed flux means it must sit closer).
- Compare Earth's position: it sits comfortably inside the Sun's
  zone, with the greenhouse making up the 33 K gap.

### Where this comes from

The equilibrium-temperature balance and the $\sqrt{L_*}$ habitable-
zone scaling follow Kasting, Whitmire and Reynolds (1993) and the
treatment in Seager, *Exoplanet Atmospheres*.

## Physical setup

A central star characterized by effective temperature $T_\text{eff}$ and radius $R_\star$ (in solar units). The luminosity is the Stefan-Boltzmann integral

$$L_\star = 4 \pi R_\star^2 \sigma T_\text{eff}^4.$$

The incident flux on a planet at distance $d$ is $S(d) = L_\star / (4 \pi d^2)$. The continuous habitable zone (Kasting recent) is the band where $S$ lies between $1.37\,S_\odot$ (inner edge, runaway greenhouse) and $0.354\,S_\odot$ (outer edge, maximum greenhouse).

## Numerical method

Closed-form. The plot scale auto-adjusts to keep the outer HZ visible.

## Controls

- $T_\text{eff}$ in K (2500 to 10000).
- $R_\star$ in $R_\odot$ (0.1 to 3).
- Test-planet distance $d$ in AU (0.05 to 5).

## Expected qualitative features

1. Sun-like default ($T = 5778$ K, $R = 1$): HZ approximately 0.85 to 1.68 AU; Earth at 1 AU well inside.
2. M-dwarf ($T = 3000$ K, $R = 0.3$): HZ shrinks to roughly 0.05-0.10 AU.
3. Hot O-star ($T = 10000$ K, $R = 3$): HZ pushes out to 10+ AU.
4. The planet marker turns green when inside the HZ and red when outside.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Sun luminosity from $R_\odot, T_\odot$ | within 1 percent of $L_\odot$ | invariants test |
| Earth at 1 AU receives $\approx 1361$ W/m$^2$ | within 1 percent | invariants test |
| asSEff at 1 AU equals 1 | within 1 percent | invariants test |
| Sun HZ: inner 0.85, outer 1.68 AU | strict | invariants test |
| Earth in Sun's HZ | strict | invariants test |
| Mercury (0.387 AU) outside HZ | strict | invariants test |
| HZ shrinks for M-dwarf | strict | invariants test |
| inner < outer always | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $T_\text{eff} \to 0$: $L_\star \to 0$, HZ vanishes.
- $R_\star \to 0$: same.
- Proxima Centauri b (0.05 AU around an M5 V): falls inside the HZ in this playground at the right slider values.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7.
- Kasting et al. 1993 (ApJ 412, 506) for the canonical CHZ band; the 1.37 / 0.354 bounds are the recent revisions.

## Stretch goals

- Add multiple planets and an animated orbit.
- Include Earth-like vs water-vapor-rich atmosphere variants of the HZ.
- Show the chronological evolution of the HZ as the star ages on the main sequence.

## Risk register

- The 1.37 / 0.354 bounds are a particular convention; some authors use slightly different limits. The playground states the choice in the prose.
