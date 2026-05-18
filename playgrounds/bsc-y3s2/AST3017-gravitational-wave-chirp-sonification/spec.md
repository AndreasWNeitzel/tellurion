---
title: "Gravitational-Wave Chirp Sonification"
slug: gravitational-wave-chirp-sonification
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'A compact binary inspirals to merger; the strain, spectrogram, and audio chirp all stay locked to the same physics.'
one_paragraph: 'Post-Newtonian chirp f(t) for a binary of total mass m1+m2 at distance D, with strain h(t) drawn on a scrolling oscilloscope, a frequency track sweeping upward, two orbiting masses in 3D, and a WebAudio sonification of the chirp.'
tags: [relativity, gr-relativity, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Gravitational-Wave Chirp Sonification

A compact-binary inspiral. A compact strain $h(t)$ strip scrolls the chirp waveform (clamped so the post-Newtonian divergence near merger cannot flood the panel) and an $f(t)$ strip tracks the rising frequency. The main panel is a 3D inspiral: two perspective-shaded spheres orbit on an inclined plane at the barycentric Kepler separation $a \propto f_\mathrm{orb}^{-2/3}$, trailing decaying spiral worldlines, while gravitational-wave fronts expand outward. When the separation collapses onto the touching radii the bodies coalesce in a bright flash into a single remnant with a photon-ring annulus and a damped ringdown wobble; the event then loops. WebAudio plays the strain shifted up to the audible band, synchronized with the visualization.

## Explainer

### What you are looking at

Two compact stars spiral together, radiating gravitational waves that
carry away orbital energy, so they spiral faster, radiate harder, and
"chirp" up in frequency until they merge and ring down. This is the
LIGO signal, and the playground shows the inspiral, the rising
waveform, and even plays it (shifted into the audible band).

### Why it chirps

A binary's gravitational-wave luminosity grows steeply as the orbit
tightens, so energy loss accelerates the inspiral. The frequency and
strain evolve, to leading (quadrupole) post-Newtonian order, as

$$f(t) \propto \mathcal M_c^{-5/8}\,(t_c - t)^{-3/8},
  \qquad
  h(t) \propto \frac{\mathcal M_c^{5/3}\,(\pi f)^{2/3}}{D\,c^4},$$

where $t_c$ is the coalescence time and $D$ the distance. The single
combination that controls the whole waveform is the chirp mass

$$\mathcal M_c = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}}.$$

Measuring the chirp rate gives $\mathcal M_c$ directly, the first thing
LIGO extracts from an event.

### Merger and ringdown

When the separation reaches the touching radii the bodies coalesce
into a single remnant black hole, which "rings down" by emitting
damped gravitational waves at its quasi-normal-mode frequency

$$f_\text{QNM} = \frac{c^3}{2\pi G M_f}
  \big[1 - 0.63(1 - a/M)^{0.3}\big],$$

set only by the final mass $M_f$ and spin $a/M$ (the black hole has no
other hair). So one event encodes the component masses (inspiral
chirp), the final mass and spin (ringdown tone), and the distance
(strain amplitude). The playground scrolls $h(t)$ and $f(t)$, animates
the 3D inspiral and merger flash, and sonifies the strain.

### Things to try

- Increase the chirp mass and watch the chirp sweep up faster and the
  strain grow.
- Listen: the audio glide tracks $f(t)$, ending in the short ringdown
  tone.
- Note the waveform amplitude scales as $1/D$: a louder chirp is a
  closer (or heavier) source.

### Where this comes from

The post-Newtonian chirp, the chirp mass, the strain amplitude, and the
ringdown quasi-normal mode follow Maggiore, *Gravitational Waves
Vol. 1*, Chapter 4.

## Physical setup

Post-Newtonian quadrupole inspiral with chirp mass
$$\mathcal{M}_c = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}}$$
Frequency evolution $f(t) \propto (\mathcal{M}_c)^{-5/8} (t_c - t)^{-3/8}$.
Strain $h(t) \propto 4 \mathcal{M}_c^{5/3} (\pi f)^{2/3} / (D c^4)$. Ringdown is exponential decay at the QNM frequency $f_\mathrm{QNM} = c^3/(2\pi G M_f)(1 - 0.63(1 - a/M)^{0.3})$ with $a/M=0.67$.

## Controls

- $m_1, m_2$ sliders (1 to 100 $M_\odot$)
- Distance (10 Mpc to 1 Gpc)
- Inclination (0 to 90 deg)
- Mute toggle
- Replay from $t = -5$ s

## Invariants

- Equal-mass 30+30 $M_\odot$ at 100 Mpc gives $\mathcal{M}_c = 26.1\ M_\odot$ within 0.1%.
- Chirp duration (10 Hz to 500 Hz) within 10% of analytic $t_c$.
- Peak strain within 20% of $4 G \mathcal{M}_c / (c^2 D)$.
- Audio at $t = -1$ s strictly higher pitch than at $t = -4$ s.

## Status note

3D inspiral-to-merger implemented: barycentric Kepler separation driven
by the existing PN freq(), perspective-shaded spheres, spiral
worldlines, expanding GW fronts, and a coalescence flash into a ringing
remnant. The chirp-mass and freq() physics and the __physicsCheck
(chirp-mass value and frequency monotonicity) are unchanged; the orbital
phase is a numerical integral of the same freq(). WebAudio sonification
present (muted by default).

## Citations

Maggiore, "Gravitational Waves Vol. 1" ch. 4 (`maggiore2008`).
