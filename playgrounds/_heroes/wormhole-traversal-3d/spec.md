---
title: Wormhole Traversal (Hero)
description: A ray-marched Morris-Thorne (Ellis) wormhole. Look into the throat and see a second universe warped into a circular window; fly through and the sky swaps. Honest framing: a geometry explorer, not a claim that wormholes exist.
caption: Figure 1. Ray-marched Ellis/Morris-Thorne wormhole; the throat is a warped window into a second universe. Embedding z = b0 asinh(l/b0). Source: Morris and Thorne, Am. J. Phys. 56 (1988) 395.
slug: wormhole-traversal-3d
status: verified
audience: portfolio
created: 2026-05-19
program: IA-Summer
course: IA Summer Program (wormhole feasibility project)
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: morris-thorne-1988
primary_chapter: 1
hook: 'Look into the throat: a whole other sky, warped into a ring. Fly through and you are there.'
one_paragraph: 'A traversable wormhole in the zero-tidal Ellis form of the Morris-Thorne geometry, ray-marched in real time: every pixel integrates a null geodesic of the metric, so the throat genuinely shows the far universe warped into a circular window, and flying through swaps the sky. The funnel panel is the exact embedding z = b0 asinh(l/b0). A photon traverses to the other universe only if its impact parameter is below the throat radius, otherwise it scatters back, which is the real lensing of this metric. This is a geometry explorer: a real traversable wormhole would require exotic matter (negative energy density) that may not exist; the playground demonstrates the spacetime shape, not the engineering.'
tags: [relativity, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 7
share_state_keys: [b0, lCam]
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

# Wormhole Traversal

## Explainer

### What you are seeing and why it matters

A wormhole is not a tunnel bored through stuff; it is a shape of
spacetime that connects two far-apart regions through a short throat.
If such a shape existed, light from the far region would reach you
bent through the throat, so you would literally see another sky framed
in a circle ahead. This playground integrates the real light paths of
the simplest such geometry, so the warped window and the sky-swap when
you pass through are physics, not a video. The honest part matters as
much as the spectacle: holding this shape open needs matter with
negative energy density (exotic matter), which nature may not permit.
The geometry is exact and beautiful; whether you could build one is
the open question.

### Try this

- Use "approach the throat": the far sky grows from a small bright
  ring into the whole forward view.
- Run "traverse": fly through and watch this sky give way to the far
  one (the star colours and pattern change).
- "orbit the mouth": sit near the throat and look around the rim.
- Widen the throat radius b0 and watch the window open up.

### The Ellis-Morris-Thorne metric

The simplest traversable wormhole is the Ellis (1973) /
Morris-Thorne (1988) geometry, in geometrised units $G = c = 1$:

$$\boxed{\;ds^2 = -\,dt^2 + d\ell^2 + (b_0^2 + \ell^2)\,d\Omega^2,\;}$$

with $d\Omega^2 = d\theta^2 + \sin^2\theta\,d\phi^2$ the unit-sphere
element. Each piece has a clean meaning:

- $\ell$, the proper radial distance from the throat. Positive
  $\ell$ is one universe; negative $\ell$ is the other. The throat
  is $\ell = 0$, where the two universes meet.
- $b_0$, the throat radius (the bottleneck width). At $\ell = 0$ the
  spheres have area $4\pi b_0^2$, which is the smallest area of any
  sphere in the geometry.
- $r(\ell) = \sqrt{b_0^2 + \ell^2}$, the circumferential ("areal")
  radius of the sphere at proper distance $\ell$. Note $r(0) = b_0$
  and $r \to |\ell|$ at large $|\ell|$ (far from the throat the
  geometry is asymptotically flat).

The embedding diagram (the "Flamm paraboloid" image so commonly
drawn) follows from setting $z(\ell) = b_0\,\mathrm{arcsinh}(\ell / b_0)$
and plotting $(z, r)$.

### How a photon goes through

Null geodesics in the Ellis metric, with conserved energy $E$ and
angular momentum $L$ from the time and azimuthal Killing vectors,
satisfy the radial equation

$$\left(\frac{d\ell}{d\lambda}\right)^2 = E^2 - \frac{L^2}{b_0^2 + \ell^2},$$

where $\lambda$ is the affine parameter along the ray. The right
side is the radial "energy" of the ray; the ray traverses the
throat if and only if its impact parameter satisfies

$$|L / E| < b_0.$$

Otherwise the ray turns at $\ell_{\rm turn} = \pm\sqrt{(L/E)^2 - b_0^2}$
and comes back. The fragment shader walks one ray per screen pixel
from the camera into the geometry and reports which side ($\mathrm{sign}\,\ell$)
the ray ends up on; that selects which of two procedural skies to
sample.

### The honest part: exotic matter

The bracketed metric is a vacuum solution only if we tolerate
$\rho < 0$ (the weak energy condition is violated). Concretely
Einstein's equations $G_{\mu\nu} = 8\pi T_{\mu\nu}$ applied to this
metric require, at the throat,

$$\rho(\ell = 0) = -\frac{1}{8\pi b_0^2} < 0.$$

This is "exotic matter": stuff with negative energy density in the
observer's local frame. The Casimir effect produces tiny localised
negative energies, but no known process produces it in the macroscopic
amounts a real traversable wormhole would need. The geometry is
exact; whether nature lets us build one is open.

### Symbols, at a glance

- $\ell$, proper radial distance (m); the two universes are
  $\ell > 0$ and $\ell < 0$; the throat is $\ell = 0$.
- $b_0$, throat radius (m).
- $r(\ell) = \sqrt{b_0^2 + \ell^2}$, circumferential radius (m).
- $t$, coordinate time (s); $d\tau = dt$ along worldlines at rest.
- $E$, photon energy (conserved by $\partial_t$); $L$, angular
  momentum (conserved by $\partial_\phi$); $b = L/E$ is the impact
  parameter with units of length.
- $\rho$, local energy density (negative at the throat).

### Bibliographic origin

The geometry was written down by Ellis, *J. Math. Phys.* **14**
(1973) 104; revived and analysed for traversability by Morris and
Thorne, *Am. J. Phys.* **56** (1988) 395 (the paper Carl Sagan asked
Kip Thorne to write so *Contact* would have honest physics). The
exotic-matter requirement is sharpened by the Morris, Thorne,
Yurtsever no-go bound in *Phys. Rev. Lett.* **61** (1988) 1446. A
modern textbook treatment is Visser, *Lorentzian Wormholes: From
Einstein to Hawking* (AIP 1995), Ch. 11, 13. Rendering this
geometry as a fragment-shader image is in Bouhebel, *Astron.
Astrophys.* **663** (2022) A156 and the *Interstellar* movie's
black-hole pipeline (James et al., *Class. Quantum Grav.* **32**
(2015) 065001).

## Physical setup

The observer flies along the axis at proper distance $\ell$ from the
throat. Each pixel ray is integrated through the Ellis metric; its
final side ($\mathrm{sign}\,\ell$) selects one of two procedural skies.

## Numerical method

RK null-geodesic integration of the Ellis metric, per pixel in a
fragment shader; the same equations (CPU) are
`shared/js/engine/wormhole-cpu.js` (DOM-free, tested in
`tests/wormhole.test.mjs`). Render:
`shared/js/engine-gl/wormhole-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 here (per-pixel
null-geodesic integration of a curved metric is not possible in
Canvas2D at 60 fps). Reuses the established `createGL2` /
`compileProgram` stack; default framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): the look direction is a yaw slider/look-around
  (the observer is on the axis; full orbit is replaced by yaw to keep
  the throat framed; stated).
- Camera zoom (scroll): intentionally absent; the field of view is
  fixed so the throat's apparent size reads as geometry, not zoom
  (stated).
- Camera pan: not applicable (the observer flies the axis).
- Direct manipulation: drag the "ship l" slider to fly along the axis
  toward and through the throat.
- Parameters: throat radius b0 (0.5 to 3); ship proper distance l
  (-16 to 16); look yaw; tidal scaling (0.2 to 3, scales the readout
  tidal-stretch proxy; Ellis is tidal-free along the worldline, so
  this is a comparison knob, stated).
- Time controls: play / pause (auto-fly along the axis), reverse,
  far-side jump. No speed multiplier (the fly speed is fixed; reverse
  + the l slider cover it).
- Presets: approach the throat, traverse, orbit the mouth, look back
  after traversal.
- Probe/readout: live proper distance |l|, the geometric tidal scale,
  which universe the ship is in, and the traverse threshold b0.

## Diagnostic plot (secondary)

A Canvas2D panel draws the exact embedding funnel z(l) for both
universes with a marker at the ship. Subordinate to the 3D
ray-march (S3).

## Expected qualitative features

1. On load the throat shows the far sky as a bright warped window
   within 3 s (S5).
2. "traverse" swaps the sky from this universe to the other (S6).
3. The embedding panel shows the two funnels meeting at the throat
   with the ship moving through.
4. Widening b0 enlarges the window; the readout threshold updates.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| throat is the minimum radius; embedding antisymmetric | exact | invariants test |
| flare-out d2r/dz2 > 0 at the throat | strict | invariants test |
| null norm conserved along a ray | drift < 1e-5 | invariants test |
| traverse below b0, scatter above b0 (untraversable blocked) | strict | invariants test |
| proper distance is \|l\|; tidal scale peaks at the throat | exact | invariants test |
| ray integration deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/wormhole.test.mjs`.

## Limiting cases for verification

- b0 -> 0: the throat pinches off (no traversal).
- l -> +-inf: the geometry is asymptotically flat (an ordinary sky).
- Impact parameter exactly b0: the ray skims the throat (bright rim).

## Citations

- Morris and Thorne, Am. J. Phys. 56 (1988) 395 (`morris-thorne-1988`).
- Ellis, J. Math. Phys. 14 (1973) 104 (`ellis-1973`).
- Misner, Thorne and Wheeler, Gravitation, Freeman 1973, Box 13
  (`mtw-gravitation`).

## Honest framing

Pedagogical playground on the geometry of a traversable wormhole. It
states plainly that holding such a throat open requires exotic matter
(negative energy density) that may not exist; it is not a claim that
wormholes are real or buildable.

## Risk register

- Per-pixel integration step count is bounded (160) for headless-GL
  performance; the CPU engine (tested) is the source of truth for the
  threshold and conservation.
- Golden determinism: capture sweeps l with a fixed b0 and near-zero
  yaw; the procedural sky has a slow time term frozen per fraction.
