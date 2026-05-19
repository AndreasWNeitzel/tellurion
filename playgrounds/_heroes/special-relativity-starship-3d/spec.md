---
title: Relativistic Starship (Hero)
description: Throttle a starship toward light speed and watch the exact Lorentz optics: stars bunch forward (aberration), shift blue ahead and red astern (Doppler), the bow field brightens (beaming), the ship length-contracts and the twin clocks drift apart.
caption: Figure 1. Cockpit sky under relativistic aberration, Doppler shift and beaming at speed beta, with the lab-frame length-contracted ship and twin clocks. Method: exact Lorentz transform of photon 4-momenta. Source: Rindler, Relativity, Sec. 4.
slug: special-relativity-starship-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Relativity
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: rindler-relativity
primary_chapter: 4
hook: 'Throttle toward light speed and the entire sky collapses into a bright blue disc ahead of the bow.'
one_paragraph: 'A first-person starship cockpit flying through a star field at speed beta = v/c. Every visible change is the exact Lorentz transform of the incoming photons: relativistic aberration bunches the stars toward the bow, the Doppler effect shifts forward stars blue and rear stars red, relativistic beaming brightens the forward field, and the corridor marker rings distort. A second panel shows the lab frame: your ship length-contracted along its motion, and twin clocks (ship vs lab) drifting apart by the Lorentz factor. Drag the throttle from a Newtonian crawl to 0.999 c and the sky transforms continuously.'
tags: [relativity, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 7
share_state_keys: [beta]
---

# Relativistic Starship

## Explainer

### What you are seeing and why it matters

Light has a fixed speed for everyone, and that single fact rebuilds
geometry. As you throttle up, the stars do not just stream past: their
positions, colours and brightness all change because you are
transforming the photons themselves. Aberration sweeps the whole sky
toward your direction of travel, so near light speed the universe ahead
collapses into a small bright disc. Forward light is Doppler-shifted
blue, rearward light red. The forward sky is beamed brighter (the same
reason a fast jet of plasma from a galaxy looks one-sided). Meanwhile
the lab sees your ship squashed along its motion and your clock running
slow. None of this is artistic licence; it is the Lorentz transform,
and it is why "how fast are you going" has no observer-independent
answer.

### Try this

- Drag the throttle from 0.1 to 0.995 and watch the star field pour
  forward and turn blue at the bow.
- Set the "relativistic (0.87)" preset: gamma is exactly 2, so the
  ship clock ticks at half the lab clock. Watch them separate.
- Click a star to read how far its apparent position moved and how
  much its 550 nm light is shifted.
- Look astern (drag to turn around): the few stars left back there are
  deeply redshifted and dim.

### The transform (collapsible)

$$\gamma=\frac{1}{\sqrt{1-\beta^2}},\quad
  \cos\theta'=\frac{\cos\theta+\beta}{1+\beta\cos\theta},\quad
  D=\frac{1}{\gamma(1-\beta\cos\theta')},\quad
  \frac{I_{\rm obs}}{I_{\rm emit}}=D^4.$$

Length contracts as $L=L_0/\gamma$; proper time runs as
$\mathrm{d}\tau=\mathrm{d}t/\gamma$.

## Physical setup

The ship moves at $\beta=v/c$ along $+z$ through a fixed catalogue of
stars (random directions, rest wavelengths 380 to 700 nm). Each star's
apparent direction is the aberration of its rest direction; its colour
is its rest wavelength divided by the Doppler factor; its brightness is
scaled by the $D^4$ beaming. Corridor rings at fixed proper spacing are
length-contracted in the lab and aberrated point by point.

## Numerical method

Closed-form exact Lorentz optics, engine
`shared/js/engine/special-relativity-cpu.js` (DOM-free, tested in
`tests/special-relativity.test.mjs`). The renderer
`shared/js/engine-gl/starship-3d.js` projects the per-star transformed
directions as additive WebGL2 points and the rings as aberrated line
strips, with a forward beaming glow.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; this hero is explicitly relaxed to
WebGL2 (a 2600-point additive star field re-transformed every frame
with a beaming glow is not feasible in Canvas2D at 60 fps). Reuses the
established `createGL2` / `compileProgram` hero stack.

## INTERACTIVITY (standard S4)

- Camera orbit (drag to rotate): the cockpit look direction is
  mouse-drag yaw/pitch (you turn your head, not orbit a target).
- Camera zoom (scroll / pinch): intentionally absent; field of view is
  fixed so the aberration is read at a constant FOV (a changing FOV
  would confound the effect being taught). Stated, not silent.
- Camera pan: not applicable (the observer is the ship).
- Direct manipulation: drag the throttle to set beta; click a star to
  probe it.
- Parameters:
  - Throttle beta (0 to 0.999): the ship speed; drives every effect.
  - Corridor marker spacing: intentionally fixed (rings at a fixed
    proper spacing) so the only variable is beta. Stated.
  - Star field density: intentionally fixed at 2600 stars for stable
    golden frames and 60 fps. Stated.
- Time controls: play / pause / reset (the lab clock; pausing freezes
  the twin-clock divergence). No speed multiplier or step (the optics
  are instantaneous in beta; the only clock is the twin readout).
- Presets: Newtonian (0.1), fast (0.6), relativistic (0.87, gamma 2),
  ultra (0.995).
- Probe/readout: click any direction to read the lab angle, the
  apparent (aberrated) angle, and the 550 nm Doppler shift; the panel
  shows beta, gamma, both clocks and the contraction ratio live.

## Diagnostic plot (secondary)

A Canvas2D strip shows the lab frame: the ship length-contracted by
1/gamma against fixed marker rings, and the two clocks (lab vs ship)
ticking apart. Subordinate to the 3D cockpit (S3).

## Expected qualitative features

1. On load (preset 0.87) the field is already aberrated forward and
   the clocks are diverging (S5 autoplay).
2. Throttling toward 0.999 collapses the whole sky into a bright blue
   forward disc (S6 drama).
3. The aft sky is sparse and red; the bow is dense and blue.
4. Probe values obey the formulae; the clocks differ by exactly gamma.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| gamma = 1/sqrt(1-beta^2) | exact | invariants test |
| spacetime interval boost-invariant | < 1e-6 | invariants test |
| aberration self-consistent under inverse boost | < 1e-9 | invariants test |
| Newtonian limit beta->0: no aberration/shift, gamma 1 | < 1e-8 | invariants test |
| beaming = Doppler^4; forward blue, aft red | exact | invariants test |
| length contraction and proper time share one gamma | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/special-relativity.test.mjs`.

## Limiting cases for verification

- beta -> 0: the sky is undistorted, clocks tick together, gamma = 1.
- beta -> 1: gamma diverges, the forward disc shrinks toward a point,
  the ship contracts toward zero length.

## Citations

- Rindler, Relativity: Special, General and Cosmological, 2nd ed.,
  OUP 2006, Sec. 4 (`rindler-relativity`).
- Misner, Thorne and Wheeler, Gravitation, Freeman 1973, Sec. 2
  (I_nu/nu^3 invariance, beaming) (`mtw-gravitation`).

## Risk register

- Golden determinism: capture sweeps beta with a fixed look and a
  seeded star catalogue; no time-based shader randomness.
- Probe inverts the projection analytically (no per-star pick), so it
  stays exact regardless of which star is nearest the cursor.
