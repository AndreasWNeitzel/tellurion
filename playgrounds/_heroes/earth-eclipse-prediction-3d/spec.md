---
title: Earth, Moon, Sun and Eclipse Prediction (Hero)
slug: earth-eclipse-prediction-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST2004
supporting_ucs: []
curriculum_year: hero
primary_citation: meeus1998
primary_chapter: 47
hero_candidate: true
hook: 'A solar eclipse needs the Moon to line up between Earth and Sun within an angular radius of ~0.5°, and the Moon''s orbit is tilted 5°: the playground shows why eclipses are rare and lets you scrub forward in time to find the next one.'
one_paragraph: 'The Earth orbits the Sun in the ecliptic plane and the Moon orbits the Earth in a plane tilted by 5.145° to the ecliptic. A solar eclipse needs the Moon to be at the right phase AND near one of the two nodes where its orbit crosses the ecliptic plane; that intersection geometry is what makes eclipses rare and predictable. The playground renders the three bodies in 3D, draws the Moon''s tilted orbital plane, and runs a numerical search for the next solar and lunar eclipse from the current time. Reference: Meeus, Astronomical Algorithms, 2nd ed., Ch. 47 and 54.'
caption: 'Figure 1. Heliocentric 3D view of Sun, Earth, and Moon with the Moon''s tilted orbital plane. Eclipses detected by angular-radius geometry (Sun-Earth-Moon for solar, Earth shadow for lunar). Method: closed-form ephemeris for circular orbits, angular separation check against summed angular radii. Source: Meeus, Astronomical Algorithms, 2nd ed., Ch. 47 and 54.'
tags: [stellar, animation, live-readout, three-d]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [date_days]
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

# Earth eclipse prediction
3D Sun-Earth-Moon geometry, eclipse search. Source: Meeus, Astronomical Algorithms, 2nd ed. (`meeus1998`).

## Explainer

### What you are looking at

A 3D heliocentric view: the Sun at the origin, the Earth on a circular
orbit 1 AU away, and the Moon orbiting the Earth in a plane that is
tilted by 5.145° from the Earth's orbital plane (the ecliptic). The
small tilted ring around Earth is the Moon's orbit. The playground
scrubs cosmic time and reports whether a solar or lunar eclipse occurs
at any moment.

The reason eclipses are rare is geometric: an eclipse needs the three
bodies on a single line within a fraction of a degree, but the Moon's
orbital plane only intersects the ecliptic at two points (its nodes).
So a solar eclipse needs both a new moon and a near-node passage of
the Moon.

### The eclipse condition

Let $\theta$ be the angular separation between the Earth-Sun and
Earth-Moon directions, $\alpha_\odot$ the angular radius of the Sun
from Earth ($\approx 0.27^\circ$), $\alpha_{\rm Moon}$ the angular
radius of the Moon ($\approx 0.26^\circ$). A solar eclipse occurs when

$$\theta \;<\; \alpha_\odot + \alpha_{\rm Moon} \;\approx\; 0.5^\circ.$$

For a lunar eclipse, the Sun is behind the Earth and the Moon enters
Earth's shadow. The condition is

$$\pi - \theta \;<\; \alpha_{\rm shadow}\!(d_{\rm EM}),$$

where the shadow's angular radius shrinks linearly with the Moon's
distance.

### Why the Moon's tilt matters

If the Moon's orbit were in the ecliptic ($i_{\rm Moon} = 0$), then
every new moon would be a solar eclipse and every full moon would be
a lunar eclipse: 12 of each per year. But with $i_{\rm Moon} = 5.145^\circ$
the Moon is usually too far above or below the Sun direction at new
moon, and the condition $\theta < 0.5^\circ$ is met only twice a year
on average. That is the "eclipse season" timing astronomers exploit
to forecast eclipses.

### Symbols

- $\vec r_E$, $\vec r_M$: heliocentric positions of Earth and Moon.
- $\theta$: angular separation Earth-Sun versus Earth-Moon.
- $\alpha_\odot$, $\alpha_{\rm Moon}$: angular radii from Earth.
- $i_{\rm Moon}$: inclination of the Moon's orbit to the ecliptic.

### Where this comes from

The eclipse-condition geometry and the ephemeris approximations follow
Meeus, *Astronomical Algorithms*, 2nd ed., Willmann-Bell 1998, Ch. 47
(solar eclipses) and Ch. 54 (lunar eclipses). The circular-orbit
approximation here is for visualization; a real prediction uses full
ELP-2000 / VSOP87 ephemerides.
