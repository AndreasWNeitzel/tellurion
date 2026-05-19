---
title: Meissner Effect (Hero)
description: Cool a superconductor below Tc and it expels the magnetic field, levitating the magnet above it. Field lines curve around the cold sample and thread straight through a warm one; warm it past Tc and the magnet drops.
caption: Figure 1. Image-dipole Meissner screening; field-line streamlines curve around the cold sample, a London skin on the surface, and the magnet levitates. Source: Tinkham, Introduction to Superconductivity, Ch. 1-2.
slug: superconductor-meissner-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Quantum Mechanics and Technology
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: tinkham-superconductivity
primary_chapter: 1
hook: 'Cool the puck and the magnet floats; warm it back and the magnet drops. The field cannot get inside.'
one_paragraph: 'A bar magnet above a superconductor. Below the critical temperature the superconductor expels the magnetic field from its interior (the Meissner effect), modelled exactly by the image dipole that makes the normal field vanish at the surface, and the resulting repulsion levitates the magnet. The field lines, integrated through that real field, curve cleanly around the cold sample and thread straight through a warm one; the thin glowing skin is the London penetration layer, over which any leaked field dies as exp(-d/lambda_L). Warm it past Tc, or push the applied field past the critical field, and superconductivity quenches: the screening vanishes and the magnet drops.'
tags: [solid-state, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [TbyTc, Bapp, lam0]
---

# Meissner Effect

## Explainer

### What you are seeing and why it matters

Most materials let a magnetic field pass through them. A
superconductor, below a certain temperature, does the opposite: it
sets up surface currents that cancel the field everywhere inside, so
the field is pushed out. Because the field cannot get in, a magnet
brought near is repelled, and it can hover with nothing touching it.
This is the Meissner effect, the unmistakable signature that a
material has truly become superconducting (not merely a very good
conductor). It is the physics behind maglev trains and frictionless
bearings. Watch the field lines: they bend around the cold sample as
if it were a hole in space; warm it through Tc and they snap straight
through it and the magnet falls.

### Try this

- "Meissner levitation": the cold sample, the magnet floating, lines
  curving around it.
- "normal (field penetrates)": warm past Tc; lines go straight
  through, the magnet drops onto the surface.
- Drag T/Tc up slowly and watch the London depth grow (the skin
  thickens) until screening fails.
- "quench by overfield": keep it cold but push the applied field past
  Hc(T); superconductivity collapses and the magnet drops.

### The physics (collapsible)

$$\lambda_L(T)=\frac{\lambda_0}{\sqrt{1-(T/T_c)^4}},\qquad
  H_c(T)=H_{c0}\!\left[1-(T/T_c)^2\right],$$

field decay $B(d)=B_{\rm surf}\,e^{-d/\lambda_L}$; the screening is the
image dipole at depth $h$ with moment $-m_z$ (so $B_\perp=0$ at the
surface), giving the levitation force
$F=\dfrac{3\,m^2}{32\,h^4}$ (units $\mu_0/4\pi=1$).

## Physical setup

A vertical point-dipole magnet at height h above a superconducting
half-space. Field lines are integrated through the engine's exact
field (dipole plus image when superconducting). The magnet settles to
the height where the image repulsion balances its weight.

## Numerical method

Closed-form image-dipole field and streamline integration of it;
engine `shared/js/engine/meissner-cpu.js` (DOM-free, tested in
`tests/meissner.test.mjs`). Render:
`shared/js/engine-gl/meissner-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 (30 integrated 3D
field-line streamlines plus shaded solids at 60 fps is not feasible
in Canvas2D). Reuses `createGL2` / `compileProgram`; default
framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera.
- Camera zoom (scroll): yes.
- Camera pan: not applicable (the sample is centred and is the
  subject; fixed target keeps it framed; stated).
- Direct manipulation: the magnet height is not hand-dragged; it
  settles to the computed levitation equilibrium (the physics places
  it). Stated as intentionally physics-driven rather than free-drag.
- Parameters: T/Tc (0 to 1.4); applied field (0 to 1.5, drives the
  Hc(T) quench); lambda0 (0.15 to 1.2, the zero-T London depth);
  magnet moment m (1 to 3.5).
- Time controls: play, pause; Cool down / Warm up shortcuts. No speed
  multiplier (the settle is a damped relaxation; the sliders are the
  control).
- Presets: Meissner levitation, normal (field penetrates), Type-II
  vortex, quench by overfield.
- Probe/readout: state (Meissner / Type-II / normal / quenched),
  lambda_L, Hc(T), the levitation height, and the bulk |B| (near zero
  when superconducting).

Type-II note: the "Type-II vortex" preset is a labelled regime
(cold, intermediate field) where real materials admit quantised flux
tubes; this playground models the field with the same image screening
and states this simplification rather than faking flux lattices.

## Diagnostic plot (secondary)

A Canvas2D panel plots the field fraction versus depth into the
sample: an exponential London decay when superconducting, flat (full
penetration) when normal. Subordinate to the 3D scene (S3).

## Expected qualitative features

1. On load (Meissner preset) the magnet is floating and the lines
   curve around the cold sample within 3 s (S5).
2. Warming past Tc or overfielding makes the lines straighten through
   the sample and the magnet visibly drop (S6).
3. The skin glows only when superconducting; the |B|-vs-depth panel
   switches from exponential to flat.
4. The bulk |B| readout is ~0 in the Meissner state.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| lambda diverges at Tc; Hc parabolic; quench logic | exact | invariants test |
| normal B vanishes at the cold surface; not for a warm sample | < 1e-2 / > 1e-2 | invariants test |
| total external field divergence-free (with and without image) | < 1e-4 | invariants test |
| London decay matches the set lambda | within 1 percent | invariants test |
| levitation 1/h^4 and weight-balanced height | exact | invariants test |
| pure functions deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/meissner.test.mjs`.

## Limiting cases for verification

- T -> 0: thinnest London skin, strongest screening, highest float.
- T -> Tc: lambda diverges, screening fails, magnet drops.
- Applied field > Hc(T): quench even when cold.

## Citations

- Tinkham, Introduction to Superconductivity, 2nd ed., Dover 2004,
  Ch. 1-2 (`tinkham-superconductivity`).
- Jackson, Classical Electrodynamics, 3rd ed., Wiley 1998, Sec. 5.6
  (image of a dipole in a perfect diamagnet) (`jackson-em`).

## Risk register

- Ideal Meissner levitation is Earnshaw-unstable; real Type-II flux
  pinning supplies stability. The playground models the force balance
  and the height and states the pinning caveat (no false stability
  claim).
- Golden determinism: capture fixes a per-fraction (T, B) preset, the
  equilibrium height and the camera.
