---
title: 1D Radiative Transfer (Uniform Slab)
slug: radiative-transfer-1d-slab
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3016
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: rybickilightman1979
primary_chapter: 1
hook: 'Look through a glowing slab: what you see is the background dimmed by absorption plus the slab''s own glow, blended by how thick it is.'
one_paragraph: 'The equation of radiative transfer for a uniform slab with constant source function S and optical depth tau has a clean closed form: I(tau) = I_in e^(-tau) + S(1 - e^(-tau)). The emerging intensity interpolates between the background I_in (transparent slab, tau much less than 1) and the slab''s own source function S (opaque slab, tau much greater than 1). The playground sweeps tau and the source contrast and shows the line going into emission or absorption, which is exactly why a spectral line appears bright or dark depending on the temperature structure. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 1.'
tags: [stellar, animation, live-readout]
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
# 1D radiative transfer
Slab with constant $S$ and finite $\tau$; closed-form $I(\tau) = I_{in} e^{-\tau} + S(1-e^{-\tau})$. Source: Rybicki-Lightman Ch. 1 (`rybickilightman1979`).

## Explainer

### What you are looking at

Look through a glowing slab of gas at a background light. What you see
is a blend: the background dimmed by absorption plus the slab's own
glow added in. Whether a spectral line shows up bright or dark falls
straight out of this one equation, and the playground lets you tune the
slab to flip a line from emission to absorption.

### The transfer equation, solved

Along a ray, intensity is lost to absorption and gained from emission.
For a uniform slab with constant source function $S$ and total optical
depth $\tau$ this integrates exactly to

$$I(\tau) = I_\text{in}\,e^{-\tau} + S\big(1 - e^{-\tau}\big).$$

Read the two terms: $I_\text{in}e^{-\tau}$ is the background attenuated
by the slab; $S(1-e^{-\tau})$ is the slab's own emission building up.
The combination interpolates between two limits:

- Optically thin ($\tau \ll 1$): $I \approx I_\text{in} + S\tau$, you
  see the background plus a faint glow.
- Optically thick ($\tau \gg 1$): $I \to S$, the background is hidden
  and you see only the slab's source function (a blackbody at the slab
  temperature if in LTE).

### Why lines are bright or dark

A spectral line has extra opacity, so it has larger $\tau$ at the line
frequency. Whether the line appears in emission or absorption depends
only on whether the slab's source function exceeds the background:
$S > I_\text{in}$ gives an emission line, $S < I_\text{in}$ an
absorption line (the Kirchhoff/Schuster picture, the reason a cool
atmosphere over a hot photosphere gives dark Fraunhofer lines but a hot
tenuous gas glows in emission lines). The playground sweeps $\tau$ and
the contrast $S$ vs $I_\text{in}$ and the line flips accordingly.

### Things to try

- Set $S > I_\text{in}$ and increase $\tau$: a faint emission feature
  saturating to the flat source function.
- Set $S < I_\text{in}$: the line goes into absorption, deepening
  toward $S$ as $\tau$ grows.
- Push $\tau \gg 1$ either way and watch the output forget the
  background entirely ($I\to S$).

### Where this comes from

The formal slab solution $I = I_\text{in}e^{-\tau} + S(1-e^{-\tau})$
and the emission/absorption-line criterion follow Rybicki and
Lightman, *Radiative Processes in Astrophysics*, Chapter 1.
