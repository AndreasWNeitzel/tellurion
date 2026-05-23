---
title: Radial-Velocity Exoplanet Detection
slug: radial-velocity-exoplanet-detection-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: [AST2004]
curriculum_year: hero
primary_citation: murraydermott1999
primary_chapter: 2
hero_candidate: true
hook: 'A planet does not orbit a star; a star and planet orbit their common center of mass. The star wobbles, its spectral lines Doppler-shift, and that wobble (51 Peg b 1995) was how the first exoplanet around a Sun-like star was found.'
one_paragraph: 'In a star+planet two-body system, both orbit the centre of mass. The star traces a small ellipse with semi-major axis a_star = a_planet * m_p / M_star, and the observer-line projection of its orbital velocity makes a periodic radial velocity (RV) curve with semi-amplitude K. The Doppler shift delta lambda / lambda = v_r / c is the observable: a 1 m/s wobble from an Earth-mass planet at 1 AU is barely at the spectroscopic detection threshold today. The playground shows the star (small ellipse), planet (large ellipse), and RV curve, plus an animated spectral line tracking the current shift. Reference: Murray and Dermott, Solar System Dynamics, Ch. 2; Lovis and Fischer in Seager (ed.) Exoplanets 2010.'
caption: 'Figure 1. Star + planet system orbiting the COM. Left: top-down orbit. Right: radial velocity curve (yellow) with current marker (blue) and a horizontally-shifting spectral line (red). Method: Kepler solver + RV formula K = (2 pi G / P)^(1/3) m_p sin(i) (M+m)^{-2/3} (1-e^2)^{-1/2}. Source: Murray and Dermott, Solar System Dynamics, Ch. 2.'
tags: [stellar, animation, three-d, live-readout, exoplanets]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [m_p, P, e, inc_deg]
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

# Radial velocity detection of exoplanets
Doppler wobble of a host star reveals a planet. Source: Murray and Dermott, Solar System Dynamics, Ch. 2.

## Explainer

### What you are looking at

A star and an orbiting planet, viewed from above. The blue dot is the
planet, the yellow dot is the star; both orbit the centre of mass (the
small cross). Because the star is much more massive than the planet,
its orbit is much smaller, but it is still there, and that motion is
how we detect the planet from Earth.

The right panel shows the star's radial velocity (line-of-sight
component) over one orbital period. When the star moves toward you,
v_r is negative (blueshift); when it moves away, v_r is positive
(redshift). A small red bar at the bottom illustrates the resulting
Doppler shift of a spectral line. The first exoplanet around a
Sun-like star (51 Peg b, Mayor and Queloz 1995) was found this way.

### The two-body orbit

For a star of mass $M_\star$ and a planet of mass $m_p$ on an orbit
of semi-major axis $a$, eccentricity $e$, inclination $i$, and period
$P$, the radial velocity of the star is

$$v_r(t) \;=\; K\,\bigl[\cos(\theta(t) + \omega) + e\cos\omega\bigr],$$

with $\theta$ the true anomaly (Kepler equation $E - e\sin E = M$,
$\theta = 2\arctan(\sqrt{(1+e)/(1-e)}\,\tan(E/2))$, $M = 2\pi(t-t_0)/P$),
$\omega$ the argument of periastron, and the RV semi-amplitude

$$K \;=\; \left(\frac{2\pi G}{P}\right)^{\!1/3}
  \frac{m_p \sin i}{(M_\star + m_p)^{2/3}}\,\frac{1}{\sqrt{1 - e^2}}.$$

For Jupiter around the Sun, $K \approx 12.5\,\mathrm{m/s}$. For Earth
around the Sun, $K \approx 0.09\,\mathrm{m/s}$. Modern spectrographs
(HARPS, ESPRESSO) get down to about $1\,\mathrm{m/s}$ on bright
quiet stars.

### The mass-inclination degeneracy

The RV signal alone gives $m_p \sin i$, not $m_p$. Without an
independent measurement of $i$ (a transit, for instance), the
inferred planet mass is a lower bound. Transit + RV together break
the degeneracy, which is why the most-characterised exoplanets are
detected by both techniques.

### Things to try

- Increase $m_p$ to grow the RV amplitude $K \propto m_p \sin i$.
- Tilt $i$ from $90^\circ$ (edge-on) toward $0^\circ$ (face-on);
  the amplitude shrinks because only the projected velocity along
  the line of sight contributes.
- Add eccentricity $e$: the RV curve loses its sinusoidal shape and
  develops a sharp peak near periastron.

### Symbols

- $M_\star$: stellar mass.
- $m_p$: planet mass.
- $P$: orbital period.
- $a$: semi-major axis of the relative orbit; $a_\star = a m_p /
  (M_\star + m_p)$ is the stellar orbit's semi-major axis.
- $e$: orbital eccentricity.
- $i$: orbital inclination ($90^\circ$ = edge-on; $0^\circ$ = face-on).
- $\omega$: argument of periastron.
- $K$: RV semi-amplitude.

### Where this comes from

The two-body RV formula and the Kepler-solver setup are in Murray and
Dermott, *Solar System Dynamics*, CUP 1999, Ch. 2. The historical
detection of 51 Peg b is Mayor and Queloz, *Nature* 378 (1995) 355. Modern RV technique is reviewed by Lovis and
Fischer in Seager (ed.), *Exoplanets*, U. Arizona Press 2010, Ch. 2.
