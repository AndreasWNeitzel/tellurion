---
title: Expanding Universe (Hero)
description: A 3D galaxy lattice obeying the live Friedmann equation. Choose what the universe is made of and watch it decelerate, accelerate, or collapse to a Big Crunch; click a galaxy and read the redshift of its light.
caption: Figure 1. Comoving galaxy lattice with proper positions scaled by the integrated Friedmann a(t). Source: Ryden, Introduction to Cosmology, Ch. 5-6.
slug: expanding-universe-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Relativity / IA cosmology
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: ryden-cosmology
primary_chapter: 5
hook: 'No galaxy is the centre, yet they all fly apart; switch on dark energy and the lattice thins to nothing, or close the universe and watch it crunch.'
one_paragraph: 'A lattice of galaxies whose separations grow with the scale factor a(t) of the Friedmann equation, integrated live from the density you choose. Every galaxy recedes from every other in proportion to distance (Hubble law) with no special centre. Matter alone decelerates the expansion; enough matter closes the universe so it expands, halts, and recollapses to a Big Crunch; dark energy makes the expansion accelerate and the lattice thin out forever. Click a galaxy to send a light pulse to you and read its redshift, which is exactly the ratio of scale factors between emission and now.'
tags: [cosmology, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 7
share_state_keys: [Om, OL, H0]
---

# Expanding Universe

## Explainer

### What you are seeing and why it matters

Space itself stretches. The galaxies are not flying through space away
from an explosion; the space between them is growing, so every observer
sees everyone else receding and nobody is at the centre. How fast that
growth is, and whether it speeds up, slows down, or reverses, is set by
one quantity: what the universe is made of. Ordinary matter gravitates
and slows the expansion. Curvature can be enough to halt and reverse
it (a Big Crunch). Dark energy does the opposite of gravity at large
scales and drives runaway acceleration, which is what our universe
actually does. The redshift of distant light is the direct evidence:
the light wave is stretched by the same factor the universe grew while
it travelled. This playground integrates the real equation and lets
you dial the ingredients.

### Try this

- Start on "dark energy (our universe)" and scrub cosmic time forward:
  the lattice accelerates apart and thins out.
- Switch to "closed (Big Crunch)": the expansion stalls, reverses, and
  the lattice collapses back to a point.
- "matter-dominated": expansion that keeps decelerating.
- Click a far galaxy and watch its light arrive reddened; the redshift
  readout is exactly $a_{\rm now}/a_{\rm emit}-1$.

### The equation (collapsible)

$$\left(\frac{\dot a}{a}\right)^2 = H_0^2\!\left[\Omega_r a^{-4}
  +\Omega_m a^{-3}+\Omega_\Lambda+\Omega_k a^{-2}\right],\quad
  \Omega_k = 1-\Omega_r-\Omega_m-\Omega_\Lambda,$$

with $a$ the scale factor ($a=1$ today), $H_0$ today's Hubble rate,
$\Omega_x$ the present density of component $x$ in critical units.
Hubble's law $v=H d$; redshift $1+z=a_{\rm obs}/a_{\rm emit}$.

## Physical setup

A cubic comoving lattice of galaxies centred on the observer. Proper
positions are comoving coordinates times $a(t)$. Light pulses travel
radially inward and carry the engine-computed redshift.

## Numerical method

RK4 integration of $\mathrm{d}a/\mathrm{d}t=\pm a H_0\sqrt{E(a)}$ with
closed-universe turnaround and Big-Crunch detection (engine
`shared/js/engine/friedmann-cpu.js`, DOM-free, tested in
`tests/friedmann.test.mjs`). Render:
`shared/js/engine-gl/cosmic-lattice-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 here (a few
thousand additive galaxy sprites rescaled every frame with depth-
based redshift is not feasible in Canvas2D at 60 fps). Reuses the
established `createGL2` / `compileProgram` stack.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera.
- Camera zoom (scroll): yes.
- Camera pan: intentionally absent; the observer sits at the lattice
  centre and a fixed orbit target keeps "no centre" honest (stated).
- Direct manipulation: click to emit a light pulse from a lattice
  galaxy toward you; it redshifts as it travels.
- Parameters: Omega_m (0 to 2), Omega_Lambda (0 to 1.5), H0 (0.5 to
  1.6 in H0 units). Omega_r is fixed tiny (radiation is negligible
  today; stated). Curvature Omega_k is derived by closure.
- Time controls: play, pause, reverse, reset to today, and a cosmic-
  time scrubber reaching into the future. No speed multiplier (the
  scrubber and reverse cover it).
- Presets: dark energy (our universe), matter-dominated, closed
  (Big Crunch), empty (coasting).
- Probe/readout: clicking a galaxy reports its proper distance,
  recession velocity and the redshift of its light; the panel shows
  cosmic time, a, H(a), the curvature class and the fate.

## Diagnostic plot (secondary)

A Canvas2D strip plots the integrated scale factor a(t) over cosmic
time with a marker at "now". Subordinate to the 3D lattice (S3).

## Expected qualitative features

1. On load (our-universe preset) the lattice is expanding and
   accelerating within 3 s (S5).
2. The closed preset visibly halts, reverses and crunches (S6).
3. Distant galaxies are redder than near ones; emitted pulses arrive
   reddened.
4. The a(t) panel matches the lattice behaviour and the readout fate.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| curvature closes the budget | exact | invariants test |
| integrated a(t) satisfies (a_dot/a)^2 = H0^2 E(a) | rel < 1e-3 | invariants test |
| Hubble's law v proportional to d | within 1 percent | invariants test |
| 1 + z equals the scale-factor ratio | < 1e-6 | invariants test |
| closed universe recollapses to a Big Crunch | strict | invariants test |
| dark energy gives accelerating (convex) growth | strict | invariants test |
| integration deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/friedmann.test.mjs`.

## Limiting cases for verification

- Flat matter only: Einstein-de Sitter, $a\propto(t-t_{\rm bb})^{2/3}$.
- Empty: Milne coasting, $a\propto t$.
- Lambda only: de Sitter, exponential acceleration.

## Citations

- Ryden, Introduction to Cosmology, 2nd ed., CUP 2017, Ch. 5-6
  (`ryden-cosmology`).
- Dodelson, Modern Cosmology, 2nd ed., Academic 2020, Ch. 2
  (`dodelson-cosmology`).

## Risk register

- Closed-universe turnaround handled by sign flip when E(a) crosses
  zero; the Big-Crunch invariant guards it.
- Golden determinism: capture fixes a per-fraction model and camera;
  no time-based shader randomness.
