---
title: Magnetar Burst (Hero)
slug: magnetar-burst-3d
status: superseded
superseded_by: neutron-star-legend-3d
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3005]
curriculum_year: hero
primary_citation: duncan-thompson-1992
primary_chapter: 1
hero_candidate: true
hook: 'A magnetar is a neutron star with a magnetic field of 10^14 to 10^15 G, so strong it warps the vacuum and the crust cracks under magnetic stress. Each crustquake reconnects field lines and releases a burst of hard X-rays.'
one_paragraph: 'A magnetar is a young (< 10^4 yr) isolated neutron star whose magnetic field B ~ 10^14 to 10^15 G dominates its energy budget (Duncan and Thompson 1992). At these fields, the magnetic stress exceeds the breaking strain of the crust; crustal motion twists external field lines until they reconnect, releasing magnetic energy as short hard-X-ray bursts (SGRs and AXPs). The Schwinger critical field B_QED = 4.4 * 10^13 G is exceeded by orders of magnitude. The spindown timescale tau = P / (2 dot P) ~ 10^3 to 10^4 yr, much shorter than the rotational ages of normal pulsars. Total magnetic-energy reservoir E_B = B^2 / 8 pi * V_NS ~ 10^47 erg at B = 10^15 G is sufficient to power both the persistent X-ray luminosity and the rare giant flares (e.g. SGR 1806-20 in December 2004, ~ 10^46 erg in 0.2 s). Reference: Duncan and Thompson, ApJ 392 (1992) L9; Mereghetti, AARv 15 (2008) 225.'
caption: 'Figure 1. Magnetar with extreme dipole field; crustquake events trigger localized reconnection and X-ray bursts. The lightcurve panel shows the typical SGR fast-rise/power-law-decay profile. Method: closed-form magnetic-dipole spindown, dipole field geometry, phenomenological lightcurve t^2 rise + t^-3/2 decay. Source: Duncan and Thompson, ApJ 392 (1992) L9.'
tags: [neutron-star, astrophysics, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [b_field_log, period_s]
---

# Magnetar burst
B > 10^14 G, crustquake reconnection X-ray flares. Source: Duncan and Thompson, *Astrophys. J.* 392 (1992) L9 (`duncan-thompson-1992`); review: Mereghetti, *Astron. Astrophys. Rev.* 15 (2008) 225 (`mereghetti-2008`).

## Explainer

### What you are looking at

A young, slowly-rotating neutron star whose magnetic field is so
extreme that it dominates over rotational energy. The white globe
is the neutron-star surface; the cyan loops are dipole magnetic
field lines (showing only the outer part; near the surface they are
many times denser). Bright flashes happen sporadically: those are
crustquakes, where magnetic stress fractures the crust and the
reconnecting field lines drive a fireball of $e^+ e^-$ pairs that
radiate hard X-rays. The bottom panel records the lightcurve of
these bursts.

### Why these fields are so extreme

For a normal pulsar, $B \sim 10^{12}\,\mathrm{G}$, well below the
quantum critical (Schwinger) field

$$B_{\rm QED} \;=\; \frac{m_e^2 c^3}{e \hbar} \;\approx\; 4.4 \times 10^{13}\,\mathrm{G}.$$

A magnetar's $B \sim 10^{14}$ to $10^{15}\,\mathrm{G}$ exceeds $B_{\rm QED}$
by an order of magnitude. In this regime the vacuum becomes
birefringent, photons can split, and the synchrotron emission becomes
gravely modified. The magnetic energy reservoir is

$$E_{\rm B} \;=\; \frac{B^2}{8\pi}\, V_{\rm NS}
   \;\approx\; 10^{47}\,\mathrm{erg}
   \,\Big(\frac{B}{10^{15}\,\mathrm{G}}\Big)^2$$

for $V_{\rm NS} = (4/3)\pi (10\,\mathrm{km})^3$. This is enough to
power a giant flare like SGR 1806-20 (2004), which released
$\sim 10^{46}\,\mathrm{erg}$ in 0.2 s.

### Magnetic-dipole spindown

Like normal pulsars, magnetars lose rotational energy to magnetic
dipole radiation. The spindown formula gives

$$\dot P \;=\; \frac{8\pi^2 R_{\rm NS}^6 B^2 \sin^2\alpha}{3 c^3 I_{\rm NS}\, P},$$

and the characteristic age is

$$\tau \;=\; \frac{P}{2 \dot P}
   \;\approx\; 10^3\,\mathrm{yr}\,
   \Big(\frac{P}{5\,\mathrm{s}}\Big)
   \Big(\frac{10^{15}\,\mathrm{G}}{B}\Big)^2.$$

So magnetars are youngest objects in the neutron-star zoo. Their long
periods ($P \sim 1$ to $10\,\mathrm{s}$) come from rapid spindown of
an originally fast-rotating proto-neutron-star.

### Bursts and crustquakes

The crust is solid lattice of nuclei with shear modulus
$\mu \sim 10^{30}\,\mathrm{erg\,cm^{-3}}$. Magnetic stress
$P_{\rm mag} = B^2 / 8\pi$ exceeds this at $B \gtrsim 10^{14}\,\mathrm{G}$;
twisting of the external field by crustal motion accumulates, and
when the stress fails, a crustquake instantly releases magnetic
energy as a hot $e^+e^-$ pair fireball. The fireball cools through
X-ray emission with a power-law decay $\dot L \propto t^{-1.5}$ (or
exponentially for giant flares).

### Symbols

- $B$: magnetic-field strength (G or T).
- $B_{\rm QED} = 4.4 \times 10^{13}\,\mathrm{G}$: Schwinger field.
- $R_{\rm NS}$, $I_{\rm NS}$: neutron-star radius and moment of inertia.
- $P$: rotation period.
- $\dot P$: spindown rate.
- $\tau = P / (2 \dot P)$: characteristic spindown age.
- $E_{\rm B} = B^2 V / 8\pi$: magnetic energy reservoir.

### Things to try

- Set $B = 10^{12}\,\mathrm{G}$ (normal pulsar): bursts vanish; $\tau
  \to 10^7\,\mathrm{yr}$.
- $B = 10^{15}\,\mathrm{G}$ (extreme magnetar): bursts every few
  seconds; reservoir $10^{47}\,\mathrm{erg}$.
- Preset SGR 1806-20: $B = 2 \times 10^{15}\,\mathrm{G}$, $P = 7.55$ s,
  $\tau \sim 1000$ yr.

### Where this comes from

Magnetar model: Duncan and Thompson, *Astrophys. J.* 392 (1992) L9
(`duncan-thompson-1992`). Observational review: Mereghetti,
*Astron. Astrophys. Rev.* 15 (2008) 225 (`mereghetti-2008`).
Quantum vacuum effects: Adler, *Ann. Phys.* 67 (1971) 599
(birefringence). 2004 giant flare: Hurley et al., *Nature* 434
(2005) 1098.
