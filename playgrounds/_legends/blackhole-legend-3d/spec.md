---
title: Black Hole
slug: blackhole-legend-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3007]
curriculum_year: hero
primary_citation: mtw-gravitation
primary_chapter: 25
hero_candidate: true
tier: legend
hook: 'A black hole is the most extreme object in the universe and the most popular in physics culture. This legend is a five-mode laboratory: photon orbits, accretion-disk Doppler imaging, Einstein-ring lensing, Kerr frame dragging, and the embedded-geometry of spacetime itself. Pick a mass, pick a spin, pick a mode.'
one_paragraph: 'A legend playground is a hero of heroes: a single object explored from every angle a researcher would use in practice. The Black Hole Legend collects eight modes around a Schwarzschild / Kerr central engine. Overview shows the event horizon, photon sphere, ISCO and a Doppler-beamed accretion disk simultaneously. Photons fires test rays at controllable impact parameter b, tracing escape (b > 2.598 R_s), capture (b < 2.598 R_s) and photon-sphere orbits (b = b_c). Lensing places a draggable background source behind the BH; an Einstein ring forms when source and lens align, splitting into two crescent images as you offset. Frame drag enables the Kerr spin a/M slider and overlays the ergosphere and ISCO retreat. Spacetime renders the embedding-diagram wireframe of the spatial slice with geodesic paths traced through it. All overlays (event horizon, photon sphere, ISCO, ergosphere, coordinate grid) toggle independently. Reference: Misner, Thorne, Wheeler, Gravitation, Ch. 25; Bardeen, Press, Teukolsky 1972.'
caption: 'Figure 1. Black Hole Legend: five-mode laboratory. Schwarzschild and Kerr horizons, photon sphere, ISCO, ergosphere; Doppler-beamed accretion disk; geodesic ray tracing; movable lensing source. Method: closed-form Schwarzschild + Bardeen-Press-Teukolsky Kerr formulas + Beloborodov-approximation bending + Refsdal 1964 lens equation. Source: Misner, Thorne, Wheeler, Gravitation, Ch. 25.'
tags: [black-hole, general-relativity, three-d, animation, live-readout, legend]
difficulty: 5
tier: legend
renderer: canvas2d
estimated_engagement_minutes: 12
share_state_keys: [mass_solar, spin_chi, mode, inclination_deg, impact_b_rs, source_beta_arcsec]
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

# Black Hole Legend
A black-hole laboratory: photon orbits, accretion-disk imaging, gravitational lensing, Kerr frame dragging, embedded geometry. Source: Misner, Thorne, Wheeler, *Gravitation*, Ch. 25; Bardeen, Press, Teukolsky, *Astrophys. J.* 178 (1972) 347; Luminet, *Astron. Astrophys.* 75 (1979) 228; Refsdal, *Mon. Not. R. Astron. Soc.* 128 (1964) 295.

## Explainer

### What you are looking at

A black hole drawn in five different ways, all with the same physical
parameters (mass $M$, dimensionless spin $\chi = a/M$). Pick a mode
from the tab strip:

- **Overview**: event horizon (black disk), photon sphere (faint
  white ring at $r = 1.5\,R_s$), innermost stable circular orbit
  ISCO (yellow ring), and a Doppler-beamed accretion disk.
- **Photons**: shoot test photons in at controllable impact parameter
  $b$. $b > b_c$ photons swing around and escape; $b = b_c$ photons
  loop on the photon sphere; $b < b_c$ photons spiral into the
  horizon.
- **Lensing**: place a background source behind the BH. Drag the
  source: an Einstein ring forms at perfect alignment; offsets give
  two crescent images.
- **Frame drag**: rotate the spin slider $a/M$ to 0.9 and watch the
  ergosphere bulge appear around the equator and the ISCO retreat
  inward.
- **Spacetime**: a Flamm embedding-diagram view of the spatial slice;
  the depression is the BH well.

### Mass and length scales

The Schwarzschild radius

$$R_s \;=\; \frac{2 G M}{c^2}
        \;=\; 2.95 \,\mathrm{km} \, \frac{M}{M_\odot}$$

sets the size of the event horizon. The photon sphere is at
$1.5\,R_s$, the critical impact parameter is

$$b_c \;=\; \frac{3\sqrt{3}}{2}\, R_s \;\approx\; 2.598\, R_s,$$

and the ISCO for Schwarzschild is at $6\,GM/c^2 = 3\,R_s$. For
maximally rotating Kerr ($\chi \to 1$), the prograde ISCO drops to
$GM/c^2 = R_s/2$ and the retrograde ISCO climbs to $9\,GM/c^2 =
4.5\,R_s$ (Bardeen, Press, Teukolsky 1972).

### Photon paths

In Schwarzschild spacetime the photon orbit equation in $u = 1/r$ is

$$\frac{\mathrm{d}^2 u}{\mathrm{d}\phi^2} + u \;=\; \frac{3 G M}{c^2}\, u^2
                                                \;=\; \frac{3}{2}\, R_s\, u^2.$$

At infinity the photon's impact parameter $b$ is the asymptotic
perpendicular distance from the BH. Solving this with a 4th-order
Runge-Kutta integrator and varying $b$ traces all the families:
escape (parabolic deflection), photon-sphere loop, and capture.

### Gravitational lensing and the Einstein ring

When the BH lens at distance $D_L$ and a background source at
distance $D_S$ are perfectly aligned, the source images into a
circle (the Einstein ring) of angular radius

$$\theta_E \;=\; \sqrt{\frac{4 G M}{c^2}\,
                       \frac{D_{LS}}{D_L\, D_S}},$$

where $D_{LS} = D_S - D_L$. For a small offset $\beta$, two images
appear at

$$x_\pm \;=\; \frac{1}{2}\big(\beta \pm \sqrt{\beta^2 + 4 \theta_E^2}\,\big).$$

Total magnification is

$$\mu \;=\; \frac{u^2 + 2}{u \sqrt{u^2 + 4}},
   \quad u \;=\; \frac{\beta}{\theta_E},$$

diverging as $\beta \to 0$ (caustic crossing).

### Kerr frame dragging

A rotating BH drags inertial frames around with it. The metric
component $g_{t\phi}$ produces a precession rate $\Omega_{LT} = 2 G J
/ (c^2 r^3)$ at large $r$ (Lense and Thirring 1918). At the
ergosphere boundary $r_e = M + \sqrt{M^2 - a^2 \cos^2\theta}$ (in $G
= c = 1$ units), the dragging is so strong that no observer can
remain at rest with respect to infinity. Inside the ergosphere
but outside the horizon, the Penrose process can extract rotational
energy.

### Hawking temperature

For completeness the legend reports the Hawking temperature $T_H =
\hbar c^3 / (8\pi G M k_B) = 6.17\times 10^{-8}\,\mathrm{K} \cdot
(M_\odot / M)$, with the evaporation timescale $t_{\rm evap} \sim
2 \times 10^{67}\,\mathrm{yr}\,(M/M_\odot)^3$.

### Symbols

- $M$: BH mass.
- $\chi = a/M = Jc/(GM^2)$: dimensionless spin parameter, $[0, 1)$.
- $R_s = 2GM/c^2$: Schwarzschild horizon radius.
- $r_+ = M + \sqrt{M^2 - a^2}$ (in $G = c = 1$): Kerr outer horizon.
- $r_{ph} = 1.5 R_s$: photon-sphere radius (Schwarzschild).
- $b_c = (3\sqrt{3}/2) R_s$: critical impact parameter.
- $r_{\rm ISCO}$: innermost stable circular orbit (Bardeen 1972).
- $\theta_E$: Einstein-ring angular radius.
- $\beta$: angular source offset from lens.
- $T_H$: Hawking temperature.

### Things to try

- **Overview**: increase the viewer-inclination slider from $0^\circ$
  (face-on disk) to $80^\circ$ (edge-on): watch the approaching
  side brighten by the relativistic Doppler factor $\delta^4$.
- **Photons**: set $b / R_s = 2.60$ (just above $b_c$): the photon
  loops the photon sphere several times before escaping; set $b /
  R_s = 2.50$ (just below): capture.
- **Lensing**: drag the background source through $\beta = 0$: watch
  two images merge into the Einstein ring.
- **Frame drag**: take $\chi = 0.9$: the ergosphere appears as a
  flattened bulge; the ISCO drops from $3 R_s$ to nearly $R_s$.
- **Spacetime**: increase mass to see the Flamm depression deepen.

### Where this comes from

Schwarzschild geometry: Misner, Thorne, Wheeler, *Gravitation*, W.
H. Freeman 1973, Chapter 25. Kerr radii and ISCO: Bardeen, Press,
Teukolsky, *Astrophys. J.* 178 (1972) 347. Accretion-disk
relativistic image: Luminet, *Astron. Astrophys.* 75 (1979) 228 (the
first BH "photograph"). Point-mass lensing: Refsdal, *Mon. Not. R.
Astron. Soc.* 128 (1964) 295. Photon-sphere derivation: Bozza,
*Phys. Rev. D* 66 (2002) 103001.
