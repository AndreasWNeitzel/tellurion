---
title: Mean-Motion Resonance and Kirkwood Gaps
slug: resonance-mean-motion-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-SS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: murray-dermott
primary_chapter: 8
hook: 'The asteroid belt has empty lanes, the Kirkwood gaps, sitting exactly where an asteroid would orbit the Sun an integer number of times for every few of Jupiter''s.'
one_paragraph: 'A mean-motion resonance occurs when the orbital periods are near a small-integer ratio, p n_J approximately q n, so the same gravitational configuration with Jupiter repeats and the perturbations add coherently instead of averaging away. The slow resonant angle phi obeys a pendulum equation, phi-double-dot proportional to -sin(phi), so an asteroid is either trapped and librating about the resonance or circulating past it; near strong resonances the chaotic pumping of eccentricity drives the body onto a planet-crossing orbit and it is removed, carving the Kirkwood gap over millions of years. The playground shows the belt, the resonant semi-major axes, and a tracer''s resonant-angle libration or circulation as the period ratio is tuned. Reference: Murray and Dermott, Solar System Dynamics, Chapter 8.'
tags: [exoplanets, animation, live-readout]
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
# Mean-motion resonances
Kirkwood gaps in the asteroid belt at 2:1, 3:1, 5:2, 7:3 with Jupiter. Source: Murray-Dermott Ch. 8.

## Explainer

### What you are looking at

The asteroid belt is not uniformly filled: it has empty lanes, the
Kirkwood gaps. They sit exactly where an asteroid would orbit the Sun
an integer number of times for every few of Jupiter's orbits. That
periodic gravitational kicking is a mean-motion resonance, and it
clears those orbits over millions of years. The playground shows the
belt, the resonant locations, and why the gaps form.

### What a mean-motion resonance is

An asteroid at semi-major axis $a$ has mean motion (orbital angular
rate) $n = \sqrt{GM_\odot/a^3}$. A $p\!:\!q$ resonance with Jupiter
(mean motion $n_J$) occurs when

$$p\,n_J \;\approx\; q\,n
  \quad\Longleftrightarrow\quad
  \frac{a}{a_J} \approx \left(\frac{q}{p}\right)^{2/3}.$$

At such an $a$ the asteroid and Jupiter return to the same relative
geometry every cycle, so Jupiter's small tug always pulls the same
way instead of averaging to zero.

### The resonant argument and chaos

The dynamics is governed by the slowly varying resonant angle
$\phi = p\,\lambda_J - q\,\lambda + (q-p)\varpi$, where $\lambda$ are
mean longitudes and $\varpi$ the perihelion longitude. Near
resonance $\phi$ either librates (the orbit is locked and protected,
as for the Hildas at 3:2 and Trojans at 1:1) or, where resonances
overlap, it circulates chaotically: the eccentricity is pumped up
until the asteroid crosses Mars or is thrown into the Sun, emptying
the lane. That is why there are gaps at 3:1, 5:2, 7:3, 2:1 (chaotic
clearing) but concentrations at 3:2 and 1:1 (protective libration).
The playground sweeps semi-major axis and shows the resonance
locations, the libration-vs-circulation of $\phi$, and the resulting
Kirkwood gaps.

### Things to try

- Place test asteroids across the belt and watch those at 3:1, 5:2,
  7:3, 2:1 get their eccentricity pumped and ejected (the gaps).
- Find the 3:2 and 1:1 resonances where the angle $\phi$ librates
  and orbits are instead protected (Hildas, Trojans).
- Note the gap locations match $a/a_J=(q/p)^{2/3}$ exactly.

### Where this comes from

Mean-motion resonances, the resonant argument, and the Kirkwood gaps
follow Murray and Dermott, *Solar System Dynamics*, Chapter 8.
