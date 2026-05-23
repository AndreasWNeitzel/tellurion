---
title: Parker Solar Wind
slug: parker-solar-wind
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: shu-vol2
primary_chapter: 17
hook: 'Plasma streams off the Sun and accelerates through the sonic surface; the wind is the Parker transonic solution itself.'
one_paragraph: 'The Parker (1958) isothermal wind shown as the wind itself: parcels leave the Sun and stream radially with dr/dt = u(r) taken from the exact transonic solution, accelerating from subsonic near the surface, through the sonic surface r_c = GM/(2 c_s^2), to a supersonic asymptote. Parcels are coloured by Mach number, so the cool dense subsonic core, the sonic crossing, and the bright supersonic wind are all visible at once. A temperature slider sets c_s (hotter corona means a faster wind and a closer sonic surface); a compact u(r) strip keeps the quantitative curve with the sonic lines and the 1 AU speed read out live.'
tags: [fluids-mhd, stellar, animation, live-readout]
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
# Parker solar wind

## Explainer

### What you are looking at

The Sun's corona is so hot it cannot stay put: it streams outward as a
supersonic wind that fills the solar system. Parker predicted this in
1958 against fierce skepticism, and the spacecraft that went looking
found exactly his transonic flow. The playground integrates parcels
along his solution and colors them by Mach number.

### The wind equation

For a steady, isothermal, spherically symmetric outflow, mass and
momentum conservation combine into one equation for the speed $u(r)$:

$$\left(\frac{u^2}{c_s^2} - 1\right)\frac{1}{u}\frac{du}{dr}
  = \frac{2}{r}\left(1 - \frac{r_c}{r}\right),$$

where $c_s$ is the (constant) sound speed and

$$r_c = \frac{GM}{2 c_s^2}$$

is the critical (sonic) radius. The structure of this equation is the
whole story: the left side changes sign at $u = c_s$, the right side at
$r = r_c$.

### Why the wind must go transonic

There is a family of solutions, but almost all are unphysical: some are
everywhere subsonic and do not reach the observed high speeds, some are
double-valued. Only one special solution threads the singular point,
passing through exactly $u = c_s$ at exactly $r = r_c$. That is the
solar wind: subsonic and slowly accelerating near the Sun, crossing
sound speed at the critical radius, and supersonic forever after. A
static atmosphere is impossible because the corona's pressure cannot
match the (near-zero) interstellar pressure at infinity; it must blow
off. The playground solves the transonic root and advects parcels by
$dr/dt = u(r)$, with a logarithmic radial map so you can see the slow
subsonic launch and the fast supersonic escape together.

### Things to try

- Watch a parcel crawl out subsonically, accelerate through the sonic
  point at $r_c$, then race away supersonically (the Mach color
  crossing 1).
- Raise the coronal temperature (sound speed): $r_c$ moves inward and
  the wind launches faster.
- Note no choice of parameters gives a static corona: the wind is
  forced.

### Where this comes from

Parker's isothermal-wind equation, the critical radius, and the unique
transonic solution follow Shu, *The Physics of Astrophysics Vol. II*,
Chapter 17, and Frank, King and Raine, *Accretion Power in
Astrophysics*, Chapter 2 (after Parker 1958).

## Physical setup

Parker (1958) isothermal solar wind. The velocity satisfies $(u^2/c_s^2 - 1)\,u^{-1}\,du/dr = (2/r)(1 - r_c/r)$ with sonic crossing at $r_c = GM/(2 c_s^2)$; the unique transonic branch passes through $u = c_s$ at $r = r_c$ and is supersonic beyond. Source: Shu Vol II Ch. 17; Frank-King-Raine Ch. 2.

## Numerical method

Closed-form transonic root from sim.js (Newton on $\psi(u) = u^2/c_s^2 - \ln(u^2/c_s^2) - 4\ln(r/r_c) - 4 r_c/r + 3$), unchanged. Parcels are advanced by $dr/dt = u(r)$ with that solution; a logarithmic radial map keeps the subsonic-to-sonic region visible. Mach number $u/c_s$ drives a viridis colour scale.

## Controls

- Coronal temperature $T$ (0.5 to 3 MK), which sets $c_s = \sqrt{2 k T / m_p}$.
- Reset (re-seed the parcel field) and Pause.

## Expected qualitative features

1. A dense, slow, cool subsonic core inside $r_c$.
2. A clear Mach-1 crossing at the dashed sonic surface, then a fast supersonic radial wind that thins outward.
3. Hotter corona gives a higher $u(1\,\mathrm{AU})$ and a smaller $r_c$.
