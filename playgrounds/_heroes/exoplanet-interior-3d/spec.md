---
title: Exoplanet Interior
description: Pick a composition, watch the cutaway. A layered terrestrial planet (iron core, silicate mantle, optional water and gas envelope) at chosen mass; the central pressure, the mass-radius position, and the pressure profile are computed live from a constant-density hydrostatic balance.
caption: Figure 1. Layered planet cutaway with the mass-radius curve and the pressure profile. Source: Seager et al. ApJ 669 (2007) 1279; Zapolsky and Salpeter ApJ 158 (1969) 809.
slug: exoplanet-interior-3d
status: verified
audience: portfolio
created: 2026-05-20
program: EVF
course: EVF Planets / IA exoplanets
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: seager-massradius
primary_chapter: 1
hook: 'Pick a composition. The cutaway reorganises and the central pressure jumps an order of magnitude.'
one_paragraph: 'Layered terrestrial planet under the constant-density approximation: an iron core, a silicate mantle, an optional water/ice layer, an optional H/He envelope, each at its characteristic density. Mass conservation fixes the interface radii, hydrostatic equilibrium gives a closed-form central pressure, and the mass-radius curve falls on the standard families (pure iron is the densest, an H/He envelope inflates the planet). The 3D cutaway shows the layered structure as the planet rotates; the side panels track the mass-radius position and the pressure profile from centre to surface.'
tags: [planetary, mass-radius, hydrostatic, animation, hero]
difficulty: 4
tier: single
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [Mearth, fIron, fSil, fWater, fGas]
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
references:
  - "Seager et al., Mass-Radius Relationships for Solid Exoplanets, Ch. 1."
---

# Exoplanet Interior

## Explainer

### What you are looking at

A terrestrial-to-mini-Neptune planet decomposed into concentric layers
of (in order from the centre): an iron core, a silicate mantle, an
optional water/ice layer, an optional H/He envelope. The big panel is
a 3D cutaway sphere that rotates so you can see the layered structure;
the side panels show where this planet falls on a family of mass-
radius curves and the pressure profile from the centre to the
surface.

### The physics under the hood

Each layer has a characteristic density at modest interior pressures:
iron core 8300, silicate mantle 4100, water/ice 1460, H/He envelope
220 (all in kg/m$^3$).

Mass conservation across each shell gives the next layer's outer
radius. The volume of a layer between $R_{i-1}$ and $R_i$ is
$\frac{4\pi}{3}(R_i^3 - R_{i-1}^3)$, and at uniform density $\rho_i$
the layer mass is

$$M_i = \frac{4\pi}{3}\,\rho_i\,(R_i^3 - R_{i-1}^3)\;\;
\Longrightarrow\;\;
\boxed{\;R_i^3 = R_{i-1}^3 + \frac{3 M_i}{4 \pi \rho_i}.\;}$$

So the user-set mass fractions completely determine the radii. The
total planetary radius is the outer radius of the outermost layer.

Inside any uniform-density layer, the cumulative mass enclosed
within radius $r$ is

$$m(r) = M_{<,k} + \frac{4 \pi \rho_k}{3}\,(r^3 - R_{k,\text{inner}}^3),$$

where $M_{<,k}$ is the mass of all inner layers. The local gravity
is $g(r) = G\,m(r)/r^2$, and hydrostatic equilibrium

$$\boxed{\;\frac{dP}{dr} = -\rho(r)\,g(r)\;}$$

integrates in closed form within the layer. Define the antiderivative

$$F_k(r) = G\,\rho_k\,\left[\frac{M_{<,k}}{r}
              - \frac{4\pi \rho_k}{6}\,r^2\right],$$

then the pressure jump across the layer is $\Delta P_k = F_k(R_{k,\text{inner}}) - F_k(R_{k,\text{outer}})$,
and the central pressure (with $P(R_{\rm surface}) = 0$) is the sum
over layers from the surface inward:

$$P_c = \sum_k \Delta P_k.$$

The factor of $\rho$ that has to be tracked carefully is which $\rho$
appears at which radius; the implementation in
`shared/js/engine/exoplanet-interior-cpu.js` precomputes
$M_{<,k}$ from inner outward, then evaluates the pressure outward
inward.

### Symbols, at a glance

- $M$, total planetary mass (kg, or expressed in Earth masses
  $M_\oplus = 5.972 \times 10^{24}\,\mathrm{kg}$).
- $R_i$, outer radius of layer $i$, with $R_0 = 0$ at the centre and
  $R_N = R_{\rm total}$ at the surface.
- $\rho_i$, density of layer $i$ (constant within the layer).
- $M_i$, mass of layer $i$; the user-set fractions $f_i$ obey
  $\sum f_i = 1$ and $M_i = f_i\,M$.
- $M_{<,k} = \sum_{j < k} M_j$, mass enclosed below layer $k$.
- $g(r)$, local gravitational acceleration; $G = 6.674 \times
  10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$.
- $P(r)$, pressure profile; $P_c \equiv P(0)$ is the central pressure.

### The constant-density approximation

Real iron, silicates, water and H/He all compress under pressure; the
density grows with depth following an equation of state $\rho(P)$.
This playground drops the compression term and uses the layer-average
density throughout. Compared to the full polytropic equations of
state of Seager+ (ApJ 669 (2007) 1279) the constant-density model:

- Reproduces Earth's radius to about 10 % (1.04 $R_\oplus$ vs the
  observed 1.000).
- Gets the qualitative ordering right: pure iron is the densest;
  water inflates the radius; an H/He envelope inflates it more.
- Gives central pressures within a factor of about $1.5$ of the
  fully compressible solution (Earth: $2.4 \times 10^{11}$ Pa vs
  the observed $3.6 \times 10^{11}$ Pa).

For an order-of-magnitude scaling argument, the radius of a
self-gravitating ball balances gravitational and degeneracy pressures
to give $R \propto M^{1/3}$ for low mass (constant density) and
$R \propto M^{-1/3}$ for very high mass (degenerate); the empirical
crossover is near $M \approx 1\,M_{\rm Jup}$.

### Things to try

- Drag the iron and silicate sliders: the cutaway re-layers, the
  central pressure jumps, and the mass-radius dot snaps to a new
  family.
- Add a water layer. The radius grows but the central pressure
  drops because the average density falls.
- Add a H/He envelope. The radius can double; this is the
  mini-Neptune branch.
- Pick the "Mercury-like" preset (70 % iron). Notice the much smaller
  radius for the same mass: a strong stamp on the mass-radius plane.

### Invariants

- Mass conservation: the sum of layer masses equals the input mass.
- Hydrostatic monotonicity: pressure is non-increasing from the
  centre to the surface (no inversions).
- Mass-radius monotonicity: at fixed composition, radius grows with
  mass.

### Acceptance thresholds

- Earth-like (32 % iron / 68 % silicate) at 1 $M_\oplus$ returns a
  radius in $[0.9, 1.1]\,R_\oplus$.
- Central pressure is strictly positive for every composition.
- Pure iron is denser than silicate is denser than water is denser
  than H/He, reflected in the mass-radius curves.

### Bibliographic origin

The polytropic mass-radius treatment in this playground follows the
canonical paper of Seager, Kuchner, Hier-Majumder and Militzer,
*Astrophys. J.* **669** (2007) 1279, which uses a Vinet equation of
state for each component. The closed-form constant-density solution
this playground uses is the Zapolsky and Salpeter, *Astrophys. J.*
**158** (1969) 809 limit. Gas envelopes inflating mini-Neptunes are
treated in Fortney, Marley and Barnes, *Astrophys. J.* **659** (2007)
1661. The full equation-of-state machinery is in Valencia, O'Connell
and Sasselov, *Icarus* **181** (2006) 545. For an accessible
introduction see Lissauer and de Pater, *Fundamental Planetary
Science: Physics, Chemistry and Habitability* (Cambridge 2013),
Ch. 7. The Earth's interior reference values (central pressure
3.6e11 Pa, core 32 % by mass) are from PREM, Dziewonski and
Anderson, *Phys. Earth Planet. Inter.* **25** (1981) 297.
