---
title: Wormhole
slug: wormhole-legend-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: MF-GR
supporting_ucs: [AST3017]
curriculum_year: legend
primary_citation: morris-thorne-wormhole-1988
primary_chapter: 1
hero_candidate: true
tier: legend
hook: 'A wormhole is a topological shortcut between two universes. Pass through the throat and you do not travel through ordinary space; you re-emerge in a region that is, in principle, arbitrarily far from where you entered. The price is exotic matter with negative energy density, which may or may not exist.'
one_paragraph: 'A laboratory for the Morris-Thorne / Ellis traversable wormhole, the simplest closed-form geometry connecting two asymptotically flat universes through a throat of radius b_0. Four interchangeable modes: Overview (a WebGL2 ray-marched view of the throat with starfields on both sides bleeding through), Traversal (an animated POV camera flying along the proper-distance coordinate l from one universe to the other, with the visual aperture pinching at the throat and expanding into the second sky), Embedding (the iconic two-funnel paraboloid r(l) = sqrt(b_0^2 + l^2), z(l) = b_0 asinh(l/b_0) drawn as a 3D mesh; the throat is the narrowest waist), and Exotic (the energy-density and ANEC integrals of the matter that would be required to hold the throat open, plus the tidal scale a traveller experiences at radius l). References: Morris and Thorne, Am. J. Phys. 56 (1988) 395; Ellis, J. Math. Phys. 14 (1973) 104; Misner, Thorne and Wheeler, Gravitation, Box 13.'
caption: 'Figure 1. Wormhole Legend, mode-switchable laboratory for the Ellis / Morris-Thorne traversable wormhole. Method: shared wormhole-cpu engine (r(l), embedding z(l), null-geodesic photon traces, ANEC integrand), shared wormhole-3d WebGL2 ray-march shader for the two-sky lensing, Canvas2D 3D depth-sorted mesh for the embedding diagram. Source: Morris and Thorne 1988; Ellis 1973.'
tags: [general-relativity, wormhole, animation, three-d, live-readout, legend]
difficulty: 5
renderer: canvas2d
estimated_engagement_minutes: 8
share_state_keys: [b0, mode]
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

# Wormhole Legend

Four-mode laboratory for the Morris-Thorne / Ellis traversable wormhole.
Source: Morris and Thorne, *Am. J. Phys.* 56 (1988) 395; Ellis, *J. Math. Phys.* 14 (1973) 104; Misner, Thorne and Wheeler, *Gravitation*,
W. H. Freeman 1973, Box 13.

## Explainer

### What you are looking at

A wormhole, in the Morris-Thorne formulation, is the static
spherically symmetric metric

$$\mathrm{d}s^2 \;=\; -\,\mathrm{d}t^2 \;+\; \mathrm{d}l^2
   \;+\; (b_0^2 + l^2)\,\mathrm{d}\Omega^2,$$

where $l \in (-\infty, +\infty)$ is the proper radial distance, $b_0$
is the throat radius and the circumferential radius

$$r(l) \;=\; \sqrt{b_0^2 + l^2}$$

is minimum at the throat $l = 0$ ($r = b_0$) and asymptotes to $|l|$
at infinity. The two halves $l > 0$ and $l < 0$ are two asymptotically
flat universes, connected through the throat. This is the simplest
geometry that has a traversable shortcut between distant regions of
the same universe (or between two universes), without an event
horizon or a singularity.

### Mode 1: Overview

The shared WebGL2 ray-march shader puts the camera in one universe
(at proper distance $l_{\rm cam} > 0$) and traces backward
null geodesics; rays that hit the throat with impact parameter
$|L/E| < b_0$ pass through and sample the OTHER universe's sky. The
rest scatter back. Visually: a glowing throat ring with a smaller,
distorted "other sky" visible through the centre.

### Mode 2: Traversal

We animate $l_{\rm cam}(t)$ smoothly from $l = +3 b_0$ through the
throat at $l = 0$ to $l = -3 b_0$ on the other side. The aperture
pinches as you approach the throat (the field-of-view of the second
sky grows from a small disk to the entire forward hemisphere), and
then opens out into the second universe. There is no horizon and no
singularity; the experience is continuous.

### Mode 3: Embedding

The equatorial slice of the wormhole embeds in 3D Euclidean space
as

$$z(l) \;=\; b_0\,\mathrm{asinh}(l / b_0),$$

so the metric on the surface $(r(l), \phi, z(l))$ reproduces the
wormhole's intrinsic metric. The result is the classic two-funnel
paraboloid: two flat asymptotic regions ($z \to \pm \infty$ at large
$|l|$, but the proper distance grows only as $|l|$) joined at the
throat of radius $b_0$.

### Mode 4: Exotic

To keep the throat open against the tendency of gravity to close it,
Morris and Thorne showed that the stress-energy tensor must violate
the null energy condition: the radial pressure is negative and the
energy density at the throat is

$$\rho(l = 0) \;=\; -\,\frac{1}{8\pi G}\,\frac{1}{b_0^2}\;<\;0$$

(in units $c = 1$). The averaged null energy condition (ANEC)
$\int T_{ab} k^a k^b\,\mathrm{d}\lambda \geq 0$ must therefore be
violated along the null ray through the throat. This is the central
catch: classical matter satisfies the ANEC; quantum-field-theoretic
constructions (Casimir plates, squeezed vacuum, Hawking-evaporation
modes) violate it, but only by tiny amounts on tiny scales. The mode
plots $\rho(l)$ and the running ANEC integral, alongside the tidal
acceleration $|R_{\rm tidal}| \sim 1/r(l)^2$ a traveller experiences.

### Symbols

- $b_0$: throat radius.
- $l$: proper radial distance; $l = 0$ is the throat, $l > 0$ and $l < 0$ are the two universes.
- $r(l) = \sqrt{b_0^2 + l^2}$: circumferential radius.
- $z(l) = b_0\,\mathrm{asinh}(l/b_0)$: embedding height.
- $\rho(l)$: energy density required.
- ANEC: averaged null energy condition.

### Things to try

- Slide $b_0$ from 0.5 to 5: the throat gets wider and the tidal
  forces felt by a traveller at fixed $l$ get weaker (1/r^2 scaling).
- Switch to Traversal mode: watch the second universe's sky open up
  through the throat as the camera approaches and crosses.
- In Embedding mode, see the iconic two-funnel saddle surface; the
  throat is the narrowest waist where the two funnels meet.

### Where this comes from

The Morris-Thorne formulation is in *Am. J. Phys.* 56 (1988) 395. The Ellis drainhole special case is
in Ellis, *J. Math. Phys.* 14 (1973) 104.
The chapter-length introduction in MTW *Gravitation* (Box 13 and
following) gives the embedding diagram derivation. The exotic-matter
requirement and ANEC violations are reviewed in Visser, *Lorentzian
Wormholes*, AIP Press 1995.
