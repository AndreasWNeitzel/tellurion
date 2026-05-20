---
title: Cosmology Legend
slug: cosmology-legend-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: [MAA-CO, MAA-CS, MF-GR]
curriculum_year: legend
primary_citation: ryden-cosmology
primary_chapter: 5
hero_candidate: true
tier: legend
hook: 'The universe expands, decelerates, accelerates, or recollapses depending on what is in it; quantum fluctuations during inflation are stretched into the seeds of every galaxy; the cosmic microwave background is the leftover heat of the hot, opaque early universe.'
one_paragraph: 'A laboratory for the universe at large. Four interchangeable modes: Expansion (a 3D comoving lattice of galaxies whose proper sizes scale with a(t) integrated from the Friedmann equation; pick LCDM, matter-only, closed Big Crunch, or empty coasting), Fate (the same Friedmann a(t) curve with all four fates overlaid and the current cosmic time tracked), CMB (an animated 2D sphere of last-scattering temperature anisotropies, Delta T / T ~ 10^-5 above the 2.725 K background), and Inflation (a single-field slow-roll inflaton rolling down V(phi), with the resulting (n_s, r) point plotted on the Planck 2018 box). The same cosmological parameters Omega_m, Omega_Lambda are shared across modes so the user builds one mental model. References: Ryden, Introduction to Cosmology, 2nd ed., Ch. 5 - 6; Mukhanov, Physical Foundations of Cosmology; Planck Collaboration 2018.'
caption: 'Figure 1. Cosmology Legend: a multi-mode laboratory for Friedmann expansion (Expansion, Fate), the CMB last-scattering surface (CMB), and slow-roll inflation (Inflation). Method: shared friedmann-cpu engine for a(t) (RK4 in cosmic time), shared cosmic-lattice-3d WebGL2 shader for the proper-scale lattice, deterministic random temperature field for the CMB, closed-form slow-roll for the inflaton trajectory and (n_s, r) observables. Source: Ryden, Introduction to Cosmology, Ch. 5 - 6.'
tags: [cosmology, friedmann, inflation, cmb, animation, three-d, live-readout, legend]
difficulty: 5
renderer: canvas2d
estimated_engagement_minutes: 8
share_state_keys: [omega_m, omega_l, mode]
supersedes: [expanding-universe-3d, inflation-quantum-fluctuations, cmb-power-spectrum-toy, matter-radiation-equality]
---

# Cosmology Legend

Four-mode laboratory for the Friedmann universe and its early-time
quantum fluctuations.
Source: Ryden, *Introduction to Cosmology*, 2nd ed., Cambridge University
Press 2017, Ch. 5 to 6 (`ryden-cosmology`); Mukhanov, *Physical
Foundations of Cosmology*, CUP 2005 (`mukhanov-cosmology`); Baumann,
*Cosmology*, CUP 2022 (`baumann-cosmology`); Planck Collaboration 2018
(`planck-2018-cosmology`).

## Explainer

### What you are looking at

The universe on the largest scale is described by one number per
cosmic time: the scale factor $a(t)$. Galaxies' separations grow in
proportion to $a$; their spectral lines redshift by $1 + z = a_{\rm
obs}/a_{\rm emit}$. The Friedmann equation tells $a(t)$ how to evolve
given what the universe is made of (matter, radiation, dark energy).
This legend walks through four facets of that single object: the
visual expansion, its possible fates, the leftover heat (CMB), and
the inflationary mechanism that seeded structure.

### Mode 1: Expansion

A comoving lattice of galaxies has fixed coordinates in the comoving
frame; their proper separations scale as $a(t)$. Open the playground
and the lattice (which never moves in comoving space) expands or
contracts in screen space as $a$ changes. The two natural presets:

- **LCDM (our universe):** $\Omega_m \approx 0.31, \Omega_\Lambda
  \approx 0.69, \Omega_k = 0$. Matter-dominated for half its life,
  then dark energy takes over and $a$ accelerates without bound.
- **Matter only:** $\Omega_m = 1, \Omega_\Lambda = 0$. Decelerating
  Einstein-de-Sitter universe with $a \propto t^{2/3}$, the textbook
  matter-era solution.
- **Closed Crunch:** $\Omega_m > 1, \Omega_\Lambda = 0$. The universe
  expands, halts, and recollapses to a Big Crunch.
- **Empty coasting:** $\Omega_m = 0 = \Omega_\Lambda$. Linear $a \propto t$.

### Mode 2: Fate

The Friedmann equation is

$$\left(\frac{\dot a}{a}\right)^2 \;=\;
   H_0^2 \Big[\Omega_m a^{-3} + \Omega_r a^{-4} + \Omega_\Lambda + \Omega_k a^{-2}\Big],$$

where $H_0$ is the present-day Hubble rate and $\Omega_k = 1 -
\Omega_m - \Omega_r - \Omega_\Lambda$. The mode integrates $a(t)$
forward and backward and overlays all four fates so you see how the
single number $\Omega_\Lambda$ separates the eternal-expansion universe
from the Big Crunch one.

### Mode 3: CMB

When the universe cooled below $T \sim 3000\,\mathrm{K}$ at redshift
$z \approx 1100$ (about 380,000 years after the Big Bang), electrons
captured protons to form neutral hydrogen. Photons stopped scattering
and streamed to us essentially unchanged. Today they form the cosmic
microwave background, a near-perfect blackbody at $T_{\rm CMB} =
2.725\,\mathrm{K}$ with tiny temperature anisotropies $\Delta T / T
\sim 10^{-5}$ from the density fluctuations of the surface of last
scattering. The mode draws the sphere of last scattering, tinted
with a deterministic random temperature field at the WMAP / Planck
power-spectrum amplitude.

### Mode 4: Inflation

Standard cosmology has a horizon problem (why is the CMB so uniform
across $\theta > 1^\circ$ patches that have never been in causal
contact?) and a flatness problem (why is $\Omega_k$ so close to
zero?). Both are solved by a phase of exponential expansion in the
very early universe, driven by an inflaton field $\phi$ rolling down
a flat potential $V(\phi)$. In the slow-roll approximation the
small parameters

$$\epsilon \;=\; \tfrac12 (M_{\rm Pl} V'/V)^2,
  \qquad
  \eta \;=\; M_{\rm Pl}^2\, V''/V$$

are both $\ll 1$ during inflation. The CMB observables are

$$n_s \;=\; 1 - 6\epsilon + 2\eta,
  \qquad r \;=\; 16\epsilon,$$

which Planck 2018 constrains as a tight box in the $(n_s, r)$ plane.
Slow-roll inflation models (quadratic $\phi^2$, Starobinsky $R^2$,
natural, etc.) land at different points; the playground plots both
trajectories and Planck's $2\sigma$ box. Quadratic inflation
($r \approx 0.14$ for $N = 60$) is excluded; Starobinsky ($r \sim 10/N^2$)
sits comfortably inside.

### Symbols

- $a(t)$: scale factor; $a_{\rm today} = 1$.
- $H = \dot a / a$: Hubble rate; $H_0 \approx 67$ to $73 \,\mathrm{km\,s^{-1}\,Mpc^{-1}}$.
- $\Omega_m, \Omega_r, \Omega_\Lambda, \Omega_k$: present-day density parameters.
- $z = a_{\rm obs} / a_{\rm emit} - 1$: redshift.
- $T_{\rm CMB} = 2.725\,\mathrm{K}$: present-day CMB temperature.
- $\phi$: inflaton field; $V(\phi)$ its potential.
- $\epsilon, \eta$: slow-roll parameters.
- $n_s, r$: scalar spectral index, tensor-to-scalar ratio.

### Things to try

- LCDM preset shows the present moment a bit past the
  matter-to-dark-energy crossover.
- Crank $\Omega_m$ up past 1 (with $\Omega_\Lambda = 0$): the
  universe turns around and recollapses.
- Crank $\Omega_\Lambda$ to 0.9: a big-rip-like runaway acceleration.
- Inflation mode: switch between quadratic and Starobinsky and
  watch the marker move out of and into Planck's box.

### Where this comes from

The Friedmann equation is in Ryden, *Introduction to Cosmology*, 2nd
ed., Ch. 5 (`ryden-cosmology`). The CMB power spectrum and Delta T / T
amplitude are from Planck Collaboration, *Astron. Astrophys.* 641
(2020) A6 (`planck-2018-cosmology`). The slow-roll inflation
construction is in Mukhanov, *Physical Foundations of Cosmology*, CUP
2005 (`mukhanov-cosmology`), and Baumann, *Cosmology*, CUP 2022
(`baumann-cosmology`).
