---
title: Dark Matter Halo and the Galactic Rotation Curve (Hero)
slug: dark-matter-halo-rotation-curve-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: MAA-GD
supporting_ucs: [AST2004, AST3017]
curriculum_year: hero
primary_citation: navarro-frenk-white-1996
primary_chapter: 1
hero_candidate: true
hook: 'Visible stars cannot keep the outer disk of a galaxy in circular orbit at the speeds we measure. The missing mass is the dark halo, and its NFW profile reshapes the rotation curve into the iconic flat plateau.'
one_paragraph: 'Galactic rotation curves are the cleanest evidence for dark matter: outside the visible disk the velocity should fall as 1/sqrt(r) if all the mass were luminous, but observations show it stays flat at hundreds of km/s out to many disk scale lengths. The playground sums three enclosed-mass components (Hernquist bulge, exponential disk, NFW dark halo) and plots v_c(r) for each, plus the total. Toggle the dark halo off and the rotation curve drops sharply outside the disk; toggle it on and the flat plateau appears. The 3D panel shows the visible disk rotating inside a dim spherical dark-matter halo. Reference: Navarro, Frenk and White, ApJ 462 (1996) 563; Binney and Tremaine, Galactic Dynamics, 2nd ed., Ch. 2.'
caption: 'Figure 1. Three-component galactic rotation curve: Hernquist bulge (gold), exponential disk (cyan), NFW dark halo (purple), and total (white). The 3D inset shows the disk inside a transparent halo. Method: closed-form enclosed-mass integrals; v_c(r) = sqrt(G M(<r) / r). Source: Navarro, Frenk, White, ApJ 462 (1996) 563.'
tags: [stellar, animation, three-d, live-readout, gravity]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [include_DM, c, M_DM]
---

# Dark matter halo rotation curve
NFW halo + bulge + disk; v_c(r) plateaued by DM. Source: Navarro, Frenk, White, ApJ 462 (1996) 563 (`navarro-frenk-white-1996`).

## Explainer

### What you are looking at

A galactic-scale Milky-Way-like rotation curve, split into three
contributions. The bulge (a compact central mass) dominates at the
smallest radii. The exponential disk dominates from a few kpc to about
ten kpc. Beyond that, the visible-mass contribution should fall as
$1/\sqrt{r}$ (Keplerian) because no more mass is being enclosed as $r$
grows. Observed rotation curves do not fall: they stay flat at
$\sim 200$ km/s out to tens of kpc. The flat plateau is the cleanest
empirical evidence for dark matter, and the standard fit is the NFW
density profile from cold-dark-matter simulations.

### The circular speed

For a spherically symmetric mass distribution, the circular speed at
radius $r$ is

$$v_c(r) \;=\; \sqrt{\frac{G\, M(\!<\!r)}{r}},$$

with $M(<r)$ the mass enclosed within $r$. The playground sums three
contributions to $M(<r)$:

#### Hernquist bulge

$$M_b(\!<\!r) \;=\; M_b\,\frac{r^2}{(r + a_b)^2}.$$

This compact profile peaks the bulge contribution at small radii.

#### Exponential disk

$$M_d(\!<\!r) \;=\; M_d\,\bigl[1 - (1 + r/h_d)\,e^{-r/h_d}\bigr],$$

a one-dimensional approximation to the enclosed mass of an
exponential surface-density disk with scale length $h_d$.

#### NFW dark halo

$$M_{\rm DM}(\!<\!r) \;=\; M_{\rm DM}\,
  \frac{\ln(1 + x) - x/(1 + x)}{\ln(1 + c) - c/(1 + c)},$$

where $x = r/r_s$ and the concentration $c = R_{\rm vir}/r_s$ sets
how centrally peaked the dark halo is. The NFW profile
$\rho \propto 1/(x(1+x)^2)$ is the universal cold-dark-matter halo
fit from Navarro, Frenk and White 1996, calibrated against
cosmological N-body simulations.

### Why the rotation curve flattens

In the disk-only model, $M(<r)$ saturates once $r \gg h_d$ and
$v_c(r) \to \sqrt{G M_{\rm disk}/r}$ falls. With the NFW halo,
$M_{\rm DM}(<r)$ keeps growing roughly like $\ln(r)$ at large radii,
which is just fast enough to keep $G M(<r) / r$ approximately constant.
That is the plateau. Toggle the dark-halo switch in the playground
and watch the cyan disk-only curve drop while the white total stays
flat.

### Symbols

- $\rho(r)$: mass density.
- $M(<r)$: mass enclosed within radius $r$.
- $G$: gravitational constant.
- $M_b$, $a_b$: bulge mass and Hernquist scale length.
- $M_d$, $h_d$: disk mass and exponential scale length.
- $M_{\rm DM}$, $r_s$, $c$: dark-halo virial mass, scale radius, and
  concentration.
- $v_c(r) = \sqrt{G M(<r)/r}$: circular speed at radius $r$.

### Things to try

- Disable the dark halo and watch the rotation curve drop outside the
  disk (the visible-matter-only prediction).
- Increase the concentration $c$ to make the halo more centrally
  peaked; the inner rotation curve rises.
- Decrease $M_{\rm DM}$ to see the plateau drop in amplitude.

### Where this comes from

The NFW dark-halo profile is from Navarro, Frenk and White, ApJ 462
(1996) 563. The Hernquist bulge profile is from Hernquist, ApJ 356
(1990) 359 (`hernquist1990`); the rotation curve derivations are
in Binney and Tremaine, *Galactic Dynamics*, 2nd ed., Princeton 2008,
Ch. 2. The empirical flat-rotation-curve case is from Rubin and Ford,
ApJ 159 (1970) 379.
