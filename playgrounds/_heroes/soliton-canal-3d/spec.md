---
title: Soliton Canal (Hero)
description: A real Korteweg-de Vries soliton travels down a 3D reflective water canal without changing shape; launch a taller one behind it and watch it overtake, pass clean through the smaller one, and emerge unchanged.
caption: Figure 1. Height field of the KdV equation u_t + 6 u u_x + u_xxx = 0 lofted into a 3D canal surface. Method: Fourier pseudo-spectral spatial derivatives with integrating-factor RK4 time stepping (Trefethen 2000, Prog. 27), WebGL2 Fresnel water. Source: Drazin and Johnson, Solitons, Ch. 2.
slug: soliton-canal-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF research projects (nonlinear waves)
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: drazin-johnson
primary_chapter: 2
hook: 'Two humps of water collide and pass straight through each other unchanged: the soliton, a wave that refuses to disperse.'
one_paragraph: 'A shallow canal whose water surface obeys the Korteweg-de Vries equation, solved live by a real Fourier pseudo-spectral integrator. A soliton is a single smooth hump that travels at constant speed without spreading, because nonlinear steepening exactly cancels dispersive spreading. Taller solitons move faster (speed = twice amplitude), so a tall one launched behind a short one catches up, passes through it, and both emerge with their original shapes and only a shift in position. Launch your own by clicking the water; or pick the contrast preset where an ordinary lump, not a soliton, just fans out into ripples.'
tags: [fluids-mhd, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [preset, amplitude, depth, speed]
---

# Soliton Canal

## Explainer

### What you are seeing and why it matters

Drop a stone in a pond and the ripple spreads out and fades: ordinary
waves disperse. In 1834 John Scott Russell chased a single hump of
water down a canal on horseback and watched it travel for kilometres
without changing shape. That hump is a soliton. It survives because
the water's nonlinearity (taller water moves faster, so the back of
the hump catches up and steepens it) exactly balances dispersion (which
would spread it out). This canal is the real Korteweg-de Vries
equation being integrated in front of you. The thing to take away:
solitons are not a trick of one equation, they are how energy travels
without loss in shallow water, optical fibres, plasmas, and even
traffic. The signature test is a collision: two solitons pass through
each other and come out unchanged, which no ordinary wave does.

### Try this

- Load "two-soliton overtaking" and watch the tall fast hump catch the
  short slow one, merge briefly, then separate with both shapes intact.
- Drag the amplitude up and launch a soliton by clicking the water:
  taller ones visibly move faster (speed = 2 x amplitude).
- Switch to "dispersing wave packet": the same-looking lump is not a
  soliton, so it just spreads into a train of ripples. Compare.
- Change canal depth and watch the dispersion change the soliton width.

### The equation (collapsible)

$$u_t + 6\,u\,u_x + u_{xxx} = 0, \qquad x \in [0,L)\ \text{periodic}.$$

The single-soliton solution is
$u(x,t) = \tfrac{c}{2}\,\mathrm{sech}^2\!\big(\tfrac{\sqrt c}{2}(x - c t - x_0)\big)$,
amplitude $a=c/2$, speed $c=2a$. The $6 u u_x$ term is nonlinear
steepening; $u_{xxx}$ is dispersion; a soliton is the exact balance.

## Physical setup

A periodic 1D canal of length $L$. The water-surface elevation
$u(x,t)$ obeys the Korteweg-de Vries equation above. The 1D field is
lofted into a 3D water strip for rendering (height = $u$, with a
transverse taper to the banks). "Canal depth" maps onto the
dispersion coefficient $\delta$ in $u_t + 6 u u_x + \delta u_{xxx}=0$.

## Numerical method

Fourier pseudo-spectral: spatial derivatives are exact multiplications
by $ik$ in wavenumber space; the quadratic term uses a 2/3 Orszag
dealiasing mask. The stiff linear dispersive part is advanced exactly
by an integrating factor (the propagator $e^{i\delta k^3 h}$), and the
remaining smooth nonlinearity by RK4 (integrating-factor RK4;
Trefethen, Spectral Methods in MATLAB, SIAM 2000, Program 27; Kassam
and Trefethen, SIAM J. Sci. Comput. 26 (2005) 1214). Engine:
`shared/js/engine/kdv-1d-spectral-cpu.js` (DOM-free, its own test
suite in `tests/kdv-1d-spectral.test.mjs`). WebGL2 surface render:
`shared/js/engine-gl/kdv-canal-3d.js`.

### Stack note (WebGL2 relaxation)

The project default is Canvas2D/SVG. This playground is explicitly
relaxed to WebGL2, justified here: a reflective animated water surface
with per-pixel Fresnel mixing of an HDR sky reflection and a
caustic-lit floor, redrawn from a 512-node field every frame at 60 fps,
is not achievable in Canvas2D. WebGL2 is reused from the established
hero stack (`createGL2`, `compileProgram`, `createFBO`,
`setupPostProcess`).

## INTERACTIVITY (standard S4)

- Camera orbit (drag to rotate): yes, shared orbit camera around the
  canal.
- Camera zoom (scroll / pinch): yes.
- Camera pan: intentionally absent (the canal is the whole scene; the
  orbit target is fixed at canal centre to keep the collision framed).
- Direct manipulation: click the water surface to inject a soliton at
  that point; the vertical drag distance during the press sets its
  amplitude (and therefore its speed, since $c=2a$).
- Parameters:
  - Amplitude (0.2 to 1.6, dimensionless surface units): height of the
    next launched soliton; also sets its speed $c=2a$ and width
    $\propto 1/\sqrt c$.
  - Canal depth (0.5 to 2.0): scales the dispersion coefficient
    $\delta$; deeper canal = stronger dispersion = wider, slower-
    steepening solitons.
  - Solitons (1 to 4): how many humps the "soliton train" preset lays
    down.
- Time controls: play, pause, speed multiplier (0.25x to 4x), reset.
  Step is intentionally absent (the spectral step is sub-perceptual;
  the speed multiplier covers slow motion down to 0.25x).
- Presets: "single soliton", "two-soliton overtaking collision",
  "soliton train", "dispersing wave packet" (a Gaussian, not a
  soliton, for contrast).
- Probe/readout: click a hump to read its amplitude, speed and width;
  a live panel shows the three KdV invariants (mass, momentum, energy)
  and their drift, so the conservation is visible, not just claimed.

## Diagnostic plot (secondary)

A small Canvas2D strip under the 3D view draws the 1D cross-section
$u(x)$ so the soliton profile and the collision are readable as a
curve. It is subordinate to the 3D scene (S3).

## Expected qualitative features

1. Within 3 s of load the two-soliton preset is running and the tall
   soliton is already moving (S5 autoplay).
2. The collision: tall overtakes short, they merge into one peak, then
   re-emerge as two, both at their original heights (S6 drama).
3. The dispersing-packet preset visibly fans into a ripple train,
   unlike any soliton.
4. The live invariant readout stays effectively constant during all of
   the above.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| KdV mass, momentum, energy conserved | rel < 1e-4 over 1e4 steps | invariants test |
| soliton amplitude-speed law c = 2a | exact | invariants test |
| single soliton keeps shape and speed | < 1% amp, < 2% displacement | invariants test |
| two-soliton post-collision amplitudes | tall < 1%, short < 3% | invariants test |
| a Gaussian disperses (field goes negative); a soliton stays positive | strict | invariants test |
| solver deterministic for identical seeds | exact | invariants test |

Confirmed in `invariants.test.mjs` and the shared
`tests/kdv-1d-spectral.test.mjs`.

## Limiting cases for verification

- One soliton, no perturbation: pure translation at $c=2a$, shape
  fixed (tested).
- Amplitude to zero: the surface goes flat and still.
- Large dispersion: solitons widen; the same lump disperses sooner.

## Citations

- Drazin and Johnson, Solitons: An Introduction, CUP 1989, Ch. 2
  (`drazin-johnson`).
- Trefethen, Spectral Methods in MATLAB, SIAM 2000, Program 27
  (`trefethen-spectral`).
- Zabusky and Kruskal, Phys. Rev. Lett. 15 (1965) 240 (soliton
  recurrence and fission) (`zabusky-kruskal`).

## Risk register

- Dealiasing is mandatory: without the 2/3 mask the quadratic term
  aliases and the invariants drift; verified present in the engine.
- Golden-frame determinism: capture seeds a fixed two-soliton state
  and a fixed camera per fraction; no time-based shader randomness.
