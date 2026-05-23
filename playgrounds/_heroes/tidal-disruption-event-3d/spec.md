---
title: Tidal Disruption Event (Hero)
slug: tidal-disruption-event-3d
status: superseded
superseded_by: blackhole-legend-3d
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3007]
curriculum_year: hero
primary_citation: rees-1988-tde
primary_chapter: 1
hook: 'A star wandering too close to a supermassive black hole gets ripped apart by tidal forces. Half its debris falls back as a t^-5/3 stream and lights up the BH for months. This is how we light up otherwise quiescent SMBHs.'
one_paragraph: 'A star of mass M_star and radius R_star on a near-parabolic orbit around a supermassive black hole (SMBH) of mass M_BH is tidally disrupted when it crosses the tidal radius R_T = R_star (M_BH / M_star)^(1/3). Inside R_T, the BH tidal field exceeds the stars self-gravity and the star is stretched into a thin stream. Half the debris is unbound (escapes); the other half is bound on highly eccentric orbits and falls back. Rees (1988) showed the bound debris energy distribution is roughly flat, giving a fallback rate dM/dt proportional to t^(-5/3) at late times. The resulting accretion flare can outshine the host galaxy for months. The playground draws the star approaching the BH, the disruption at R_T, the resulting stream, and the lightcurve L(t) with its characteristic t^-5/3 power-law decay. Reference: Rees, Nature 333 (1988) 523.'
caption: 'Figure 1. Tidal disruption of a sun-like star by a 10^6 M_sun SMBH. Top: orbital geometry with the star approaching on a near-parabolic orbit, crossing the tidal radius R_T = R_star (M_BH/M_star)^(1/3), and being stretched into a debris stream. Bottom: lightcurve L(t) showing the t^(-5/3) Rees fallback after the peak at t_peak ~ 40 days. Method: tidal-radius criterion, fallback rate from frozen-in energy spread, peak luminosity capped at L_Edd. Source: Rees, Nature 333 (1988) 523.'
tags: [astrophysics, black-hole, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [m_bh, m_star, r_star]
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

# Tidal disruption event
Star + SMBH + t^-5/3 fallback. Source: Rees, *Nature* 333 (1988) 523; Hills, *Nature* 254 (1975) 295; review: Komossa, *J. High Energy Astrophys.* 7 (2015) 148.

## Explainer

### What you are looking at

A supermassive black hole at the centre. A sun-like star on a long
parabolic orbit drifts inward. When the star crosses the tidal
radius $R_T$, the difference in gravitational force across its
diameter overwhelms the star's self-gravity and it is stretched into
a thin debris stream. About half the debris is unbound and flies
off into the galaxy; the other half is bound to the BH on highly
eccentric orbits, returns over a wide range of orbital periods and
forms a transient accretion disk. The disk shines for months to
years, producing a TDE flare visible across cosmic distances.

### The tidal radius

A star of mass $M_\star$ and radius $R_\star$ feels a tidal
acceleration $\sim 2 G M_{\rm BH} R_\star / r^3$ at distance $r$ from
a BH of mass $M_{\rm BH}$. Its own self-gravity at the surface is
$\sim G M_\star / R_\star^2$. Setting these equal,

$$R_T \;=\; R_\star \,\Big(\frac{M_{\rm BH}}{M_\star}\Big)^{1/3}.$$

For a sun-like star ($R_\star = R_\odot$, $M_\star = M_\odot$) and a
$10^6\,M_\odot$ BH, $R_T = 100\,R_\odot \approx 0.5\,\mathrm{AU}$.

### Disruption vs whole-swallow

The disruption requires $R_T > R_S$, where
$R_S = 2 G M_{\rm BH}/c^2$ is the Schwarzschild horizon. For a
sun-like star, this gives $M_{\rm BH} \lesssim 10^8\,M_\odot$.
Bigger BHs swallow the star whole (no flare visible). This is why
TDE flares only come from intermediate-mass SMBHs.

### The Rees t^(-5/3) lightcurve

After disruption the bound debris has a roughly flat distribution in
specific orbital energy $\epsilon$. The orbital period of each
fragment scales as $T(\epsilon) \propto |\epsilon|^{-3/2}$, so the
return rate $\mathrm{d}M / \mathrm{d}t = \mathrm{d}M / \mathrm{d}\epsilon
\times \mathrm{d}\epsilon / \mathrm{d}t \propto T^{-5/3}$. The
accretion rate drives a luminosity

$$L(t) \;\approx\; 0.1\,\dot M\, c^2 \quad \text{(capped at } L_{\rm Edd}\text{)},
  \quad \dot M(t) \;=\; \dot M_{\rm peak}\,\left(\frac{t}{t_{\rm peak}}\right)^{-5/3}
  \quad \text{for } t \gtrsim t_{\rm peak}.$$

The peak time depends on the orbital period at the tidal radius:

$$t_{\rm peak} \;\approx\; 2\pi
   \left(\frac{R_T^3}{G M_{\rm BH}}\right)^{1/2}
   \!\!\left(\frac{M_{\rm BH}}{M_\star}\right)^{1/2}
   \approx 40\,\mathrm{days}\,
   \left(\frac{M_{\rm BH}}{10^6 M_\odot}\right)^{1/2}\!
   \left(\frac{M_\star}{M_\odot}\right)^{-1}\!
   \left(\frac{R_\star}{R_\odot}\right)^{3/2}.$$

### Symbols

- $M_{\rm BH}$, $M_\star$: BH and star masses.
- $R_\star$: stellar radius.
- $R_T$: tidal-disruption radius.
- $R_S = 2 G M_{\rm BH}/c^2$: Schwarzschild radius.
- $\dot M$: mass return rate from bound debris.
- $t_{\rm peak}$: time of peak fallback (when the most-bound debris
  returns).
- $L_{\rm Edd} = 1.26 \times 10^{31}\,\mathrm{W}\,(M_{\rm BH}/M_\odot)$:
  Eddington luminosity (radiation-pressure limit).

### Things to try

- Default $M_{\rm BH} = 10^6\,M_\odot$, sun-like star: classic TDE with
  $t_{\rm peak} \sim 40$ days, peak luminosity $\sim L_{\rm Edd}$
  (a few months of bright activity).
- Increase $M_{\rm BH}$ above $10^8\,M_\odot$: $R_T < R_S$, the star
  is swallowed whole, no flare (the "Hills mass" cutoff).
- Decrease $M_\star$ to 0.3 $M_\odot$ (M-dwarf): TDEs of low-mass
  stars peak at lower luminosity but the disruption itself is more
  violent (deeper inside $R_T$).

### Where this comes from

The tidal-radius criterion and the $t^{-5/3}$ fallback law are
Rees, *Nature* 333 (1988) 523; earlier:
Hills, *Nature* 254 (1975) 295. Modern numerical-relativity
simulations and observations are reviewed in Komossa,
*J. High Energy Astrophys.* 7 (2015) 148.
Energy distribution and stream dynamics: Lodato, King and Pringle,
*Mon. Not. R. Astron. Soc.* 392 (2009) 332.
