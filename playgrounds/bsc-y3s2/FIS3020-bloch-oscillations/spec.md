---
title: Bloch Oscillations
slug: bloch-oscillations
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3020
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 12
hook: 'Apply a steady force to an electron in a crystal and it does not run away; it oscillates back and forth, Bragg-reflected at the band edge.'
one_paragraph: 'A free electron under a constant force accelerates forever; an electron in a periodic crystal does not. Its quasi-momentum slides steadily across the Brillouin zone, but at the zone boundary it Bragg-reflects, so in a single cosine band the velocity oscillates and the electron rattles in place: Bloch oscillations. The playground tilts the band with a field and animates the quasi-momentum sweeping the zone while the real-space position oscillates. It is hard to see in ordinary crystals because scattering interrupts it, but it is observed cleanly in semiconductor superlattices and cold-atom lattices. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 12.'
tags: [solid-state, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Bloch oscillations
Particle in a tilted cosine band; quasi-momentum slides through the BZ and Bragg-reflects. Source: Ashcroft-Mermin Ch. 12 (`ashcroft-mermin`).

## Explainer

### What you are looking at

Apply a constant force (an electric field) to an electron in a crystal
and intuition says it accelerates away. It does not. It oscillates back
and forth in place. The playground tilts a band with a field and shows
the electron's quasi-momentum sliding across the Brillouin zone,
Bragg-reflecting at the edge, and the real-space position rocking, the
Bloch oscillation.

### The two equations

The electron's quasi-momentum responds to the force exactly like a free
particle:

$$\hbar\,\dot k = -eE \quad\Longrightarrow\quad
  k(t) = k_0 - \frac{eEt}{\hbar},$$

so $k$ ramps linearly forever. But its velocity is the slope of the
band, not $\hbar k/m$:

$$v(k) = \frac{1}{\hbar}\frac{dE}{dk}
  = \frac{2ta}{\hbar}\sin(ka)$$

for a single cosine band $E(k) = -2t\cos(ka)$. As $k$ ramps through the
zone, $v$ traces a full sine and *reverses*: at the zone boundary the
electron Bragg-reflects off the lattice.

### The oscillation

Because $v$ is periodic in $k$ and $k$ ramps linearly in time, the
velocity (and the real-space position) oscillate with the Bloch period

$$T_B = \frac{2\pi\hbar}{eEa}.$$

The electron rattles in a region of size $\sim$ bandwidth$/eE$ instead
of running away: a constant force produces an AC response, the exact
opposite of free acceleration. In ordinary crystals scattering
interrupts it long before one period, but it is seen cleanly in
semiconductor superlattices and cold-atom optical lattices. The
playground sweeps the field and shows $T_B \propto 1/E$.

### Things to try

- Watch quasi-momentum ramp steadily while the velocity oscillates and
  flips sign at the zone boundary (Bragg reflection).
- Increase the field and watch the Bloch period shrink ($T_B \propto
  1/E$) and the real-space excursion shrink too.
- Note the electron never escapes: a DC force gives an AC motion.

### Where this comes from

The semiclassical $\hbar\dot k = -eE$, the band-velocity
$v = \hbar^{-1}dE/dk$, and Bloch oscillations follow Ashcroft and
Mermin, *Solid State Physics*, Chapter 12.
