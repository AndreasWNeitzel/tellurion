---
title: Lienard-Wiechert Beaming and Synchrotron Lobe
slug: lienard-wiechert-synchrotron
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2013
supporting_ucs: [AST3016]
curriculum_year: bsc-y2s1
primary_citation: jackson3e
primary_chapter: 14
hook: 'Speed a radiating charge close to c and its broad dipole doughnut collapses into a tight forward searchlight of half-angle about 1/gamma.'
one_paragraph: 'A slowly accelerating charge radiates in the broad sin^2 dipole pattern. Push it to relativistic speed and the Lienard-Wiechert fields beam that radiation into a narrow forward cone of opening angle about 1/gamma: the faster the charge, the tighter and brighter the searchlight. The playground shows the two canonical cases, acceleration parallel to the velocity and acceleration perpendicular to it (the synchrotron lobe), and how the pattern sharpens as gamma grows. This relativistic headlight effect is why synchrotron sources are so sharply directed and why pulsar and jet emission reaches us as beams. Reference: Jackson, Classical Electrodynamics, 3e, Ch. 14.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Lienard-Wiechert beaming
Relativistic radiation collimates into a forward cone of opening angle $\sim 1/\gamma$. Two limits (a parallel and a perpendicular to v) are shown. Source: Jackson 3e Ch. 14 (`jackson3e`).

## Explainer

### What you are looking at

A slow accelerating charge radiates a gentle doughnut of light. Push
it to nearly the speed of light and that pattern collapses into a
tight forward searchlight beam. The playground shows the radiation
pattern of an accelerated charge and how relativistic beaming squeezes
it into a narrow cone as the speed rises, the physics behind
synchrotron sources and pulsar beams.

### The radiated pattern

An accelerated charge radiates with the Lienard-Wiechert angular
power distribution. In the charge's own frame it is the familiar
$\sin^2\theta$ dipole doughnut (no emission along the acceleration).
Boosting to the lab frame, the strong forward-backward asymmetry of
relativistic aberration distorts it. The two textbook limits the
playground draws:

- Acceleration parallel to velocity (linear accelerator / bremsstrahlung):

$$\frac{dP}{d\Omega} \propto
  \frac{\sin^2\theta}{(1-\beta\cos\theta)^5}.$$

- Acceleration perpendicular to velocity (circular motion /
  synchrotron):

$$\frac{dP}{d\Omega} \propto
  \frac{1}{(1-\beta\cos\theta)^3}
  \left[1 - \frac{\sin^2\theta\,\cos^2\phi}
  {\gamma^2(1-\beta\cos\theta)^2}\right].$$

### Relativistic beaming

The decisive factor is the $(1-\beta\cos\theta)$ denominators: as
$\beta\to1$ they become extremely small in the forward direction, so
the power piles up into a narrow cone of half-angle

$$\theta \sim \frac{1}{\gamma},
  \qquad \gamma = \frac{1}{\sqrt{1-\beta^2}}.$$

A $\gamma=100$ electron beams its radiation into about half a degree.
This headlight effect is why synchrotron radiation from a circulating
electron sweeps past an observer as a brief flash (giving the broad
synchrotron spectrum), why pulsars appear as pulses, and why
relativistic jets look so bright when pointed at us (Doppler
boosting). The playground sweeps $\beta$ (hence $\gamma$) and shows
the doughnut collapsing into the $1/\gamma$ forward cone for both
acceleration geometries.

### Things to try

- Start at low $\beta$ and see the symmetric dipole doughnut.
- Increase $\beta$ toward 1 and watch the lobe sharpen into a
  forward beam of half-angle $\sim1/\gamma$.
- Compare the parallel and perpendicular cases: both beam forward,
  but the angular shapes differ.

### Where this comes from

The Lienard-Wiechert angular distributions and relativistic beaming
follow Jackson, *Classical Electrodynamics*, 3rd ed., Chapter 14, and
Rybicki and Lightman, *Radiative Processes in Astrophysics*,
Chapter 4.
