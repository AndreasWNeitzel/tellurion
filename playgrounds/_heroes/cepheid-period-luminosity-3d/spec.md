---
title: Cepheid Variable Period-Luminosity (Hero)
slug: cepheid-period-luminosity-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [AST2004]
curriculum_year: hero
primary_citation: madore-freedman-1991
primary_chapter: 1
hero_candidate: true
hook: 'Henrietta Leavitt found in 1908 that longer-period Cepheid variable stars are intrinsically brighter. The slope is M_V = -2.78 log P -1.35, and that single relation is the first rung of the cosmic distance ladder.'
one_paragraph: 'Classical (Type I) Cepheid variables are yellow supergiants pulsating radially through the kappa mechanism, a He II partial-ionization opacity bump that drives the oscillation. Their pulsation period (1 to 100 days) is tightly correlated with their mean absolute magnitude through the Leavitt Law M_V = -2.78 log10 P(days) - 1.35 (Madore + Freedman 1991), allowing Cepheids to serve as standard candles out to ~ 30 Mpc with HST and the largest ground-based telescopes. The playground shows a pulsating Cepheid (radius and effective temperature varying with phase), its V-band lightcurve, and the period-luminosity diagram with a handful of well-studied Galactic Cepheids (delta Cep, eta Aql, l Car, ...) plotted on the Leavitt Law. Reference: Madore + Freedman, PASP 103 (1991) 933.'
caption: 'Figure 1. Cepheid period-luminosity relation. A pulsating Type I Cepheid (left) varies in radius and temperature with phase, producing the asymmetric V-band lightcurve (middle). The right panel shows the Leavitt Law M_V vs log10 P with the current star and Galactic calibrators. Method: kinematic radial pulsation R(t) = R0 (1 + dR sin(2 pi phi)); Madore-Freedman 1991 PL fit. Source: Madore + Freedman, PASP 103 (1991) 933.'
tags: [stellar, asteroseismology, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [period_days]
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

# Cepheid period-luminosity relation
Leavitt Law. Source: Madore + Freedman, *PASP* 103 (1991) 933; original discovery: Leavitt, *Harvard Coll. Obs. Circ.* 173 (1912) 1.

## Explainer

### What you are looking at

A classical (Type I) Cepheid variable star: a yellow supergiant whose
outer envelope pulsates radially. The pulsation is sustained by the
kappa mechanism: a partial-ionization layer of He II near the
star's surface compresses, becomes opaque, traps the outgoing
radiation, expands, becomes transparent again, and the cycle repeats
with period $P \sim 1$ to $100$ days. The star's radius, effective
temperature, and luminosity all oscillate, but not in phase: the V-band
lightcurve has the characteristic Cepheid asymmetry (sharp rise,
slower decline).

### The Leavitt Law

Henrietta Leavitt (1908; 1912) discovered that the apparent magnitudes
of Cepheids in the Small Magellanic Cloud correlate tightly with
their pulsation periods (the SMC stars are all at roughly the same
distance, so brighter == intrinsically more luminous). The modern
calibration (Madore + Freedman 1991, HST Key Project) is

$$M_V \;=\; -2.78\, \log_{10} P_{\rm days} \;-\; 1.35.$$

This is the foundational rung of the cosmic distance ladder: measure
the period of a Cepheid in a distant galaxy, predict $M_V$, compare
to the apparent magnitude $m_V$, and compute the distance modulus

$$m_V \;-\; M_V \;=\; 5\,\log_{10} d_{\rm pc} \;-\; 5.$$

Modern Cepheid distances anchor the Type Ia supernova zero point and
hence $H_0$.

### Why longer-period Cepheids are brighter

The Cepheid instability strip lies at roughly fixed $T_{\rm eff}$,
so $L \propto R^2$. Stars with larger radii have longer pulsation
periods because the sound-crossing time $P \sim R / c_s$ grows with
$R$. Combining: $L \propto R^2 \propto P^2$, giving a magnitude-period
slope $-2.5 \log_{10} P^2 = -5 \log P$. The empirical slope $-2.78$
is shallower because $T_{\rm eff}$ also varies modestly along the
instability strip and because of bolometric corrections.

### Lightcurve shape

The Cepheid lightcurve is asymmetric: brightness rises rapidly to
maximum (the surface is heated and contracts), then slowly falls
through expansion. We model the phase dependence as

$$R(\phi) \;=\; R_0\,\big[1 + \delta_R \sin(2\pi\phi)\big],
  \quad
  T(\phi) \;=\; T_0\,\big[1 - \delta_T \sin(2\pi\phi - \pi/4)\big],$$

with $\delta_R \sim 0.10$ and $\delta_T \sim 0.08$, then compute
$L(\phi) = R^2 T^4 / R_\odot^2 T_\odot^4$ (in solar units).
The quarter-period phase lag of $T$ relative to $R$ produces the
asymmetric shape observed in real Cepheids.

### Symbols

- $P$: pulsation period (days).
- $M_V$: absolute V-band magnitude.
- $m_V$: apparent V-band magnitude.
- $d$: distance (parsecs).
- $R_0, T_0$: mean radius and effective temperature.
- $\delta_R, \delta_T$: fractional amplitudes (~ 0.1).
- $\phi$: pulsation phase ($0 \le \phi < 1$).

### Things to try

- Drag the period from 5 to 50 days and watch the Cepheid's
  intrinsic brightness rise from $M_V = -3.3$ (delta Cep type) to
  $M_V = -6.1$ (l Car, RS Pup).
- The lightcurve always has the same asymmetric Cepheid shape; only
  the amplitude and time-axis scale change with $P$.
- Note that all Galactic-calibrator Cepheids (yellow dots in the PL
  panel) lie on the Madore + Freedman line within scatter of $\pm
  0.2$ mag.

### Where this comes from

Original PL discovery: Leavitt, *Harvard Coll. Obs. Circ.* 173 (1912)
1. Modern HST calibration: Madore + Freedman,
*Publ. Astron. Soc. Pacific* 103 (1991) 933.
Reviews: Freedman, *Astrophys. J.* 919 (2021) 16; Riess et al.,
*Astrophys. J.* 826 (2016) 56. The kappa-mechanism theory is in
Cox, *Theory of Stellar Pulsation*, Princeton 1980.
