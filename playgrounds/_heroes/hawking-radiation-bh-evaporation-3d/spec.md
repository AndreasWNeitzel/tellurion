---
title: Hawking Radiation and BH Evaporation (Hero)
slug: hawking-radiation-bh-evaporation-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS3007
supporting_ucs: [AST3014]
curriculum_year: hero
primary_citation: hawking-1975
primary_chapter: 1
hero_candidate: true
hook: 'A black hole is not black. Hawking showed in 1974 that the quantum vacuum at the horizon produces a thermal flux T_H ~ 1/M. The smaller the BH, the hotter; primordial 10^11 kg BHs are exploding now.'
one_paragraph: 'Quantum field theory in the curved spacetime of a Schwarzschild black hole predicts a thermal flux of radiation at temperature T_H = hbar c^3 / (8 pi G M k_B), inversely proportional to the BH mass. The radiated power P_H = hbar c^6 / (15360 pi G^2 M^2) drains the BH mass following dM/dt = -P_H/c^2, with closed-form solution M^3 = M_0^3 - 3 K t and evaporation time t_evap = 5120 pi G^2 M^3 / (hbar c^4) ~ 2 * 10^67 yr * (M/M_sun)^3. A solar-mass BH has T_H = 6 * 10^-8 K (colder than the CMB and far below detection); primordial 10^11 kg BHs from the early universe have T_H ~ 10^12 K and evaporate over an age-of-universe timescale, ending in a flash of gamma rays. The playground visualizes particle-antiparticle pair production at the horizon (one falls in, one escapes), with live readouts of M(t), T_H, P_H and t_evap. Reference: Hawking, Comm. Math. Phys. 43 (1975) 199.'
caption: 'Figure 1. Black-hole evaporation via Hawking radiation. Particle pairs pop into existence at the horizon; one falls in (negative-energy mode), the other escapes (positive-energy quantum). The BH shrinks; the temperature T_H climbs as M decreases. Method: closed-form Hawking formulas T_H, P_H, t_evap and M(t) integral. Source: Hawking, Comm. Math. Phys. 43 (1975) 199.'
tags: [black-hole, quantum, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [mass_kg]
---

# Hawking radiation and black-hole evaporation
T_H ~ 1/M. Source: Hawking, *Commun. Math. Phys.* 43 (1975) 199 (`hawking-1975`); original Letter: Hawking, *Nature* 248 (1974) 30 (`hawking-1974`).

## Explainer

### What you are looking at

A non-rotating (Schwarzschild) black hole in the centre of the scene
with an orange photon ring. The horizon at $r_s = 2GM/c^2$ is the
boundary at which spacelike falls inward. Quantum field theory on
this curved background predicts that virtual particle-antiparticle
pairs near the horizon get separated: the negative-energy mode falls
in (reducing the BH mass slightly), and the positive-energy mode
escapes to infinity as a Hawking quantum. The flux of escaping
quanta is thermal at the Hawking temperature.

The playground draws those pair events as little flashes at the
horizon, with the escaping quanta streaming outward and the captured
modes spiralling in. The right panel tracks the BH mass and
temperature over the (compressed) evaporation timeline.

### The Hawking temperature

The Hawking temperature is

$$T_H \;=\; \frac{\hbar c^3}{8 \pi G M k_B}
        \;=\; 6.17 \times 10^{-8}\,\mathrm{K}\,
              \frac{M_\odot}{M}.$$

A solar-mass BH is colder than the cosmic microwave background by
six orders of magnitude. To reach $T_H = T_{\rm CMB} = 2.73\,\mathrm{K}$,
the BH mass must be $M \approx 2 \times 10^{-8}\,M_\odot \approx
4 \times 10^{22}\,\mathrm{kg}$ (about half the mass of the Moon).
For smaller BHs the radiation is detectable; below the moon-mass scale
the BH is "evaporating" hotter than its environment.

### The evaporation time

The radiated power (a thermal Stefan-Boltzmann flux through the
horizon area $A = 4\pi r_s^2$) is

$$P_H \;=\; \sigma\, T_H^4\, A_{\rm BH}
        \;=\; \frac{\hbar c^6}{15360 \pi G^2 M^2}.$$

Setting $\mathrm{d}M/\mathrm{d}t = -P_H/c^2$ gives the integrable
equation $M^2\,\mathrm{d}M = -K\,\mathrm{d}t$ with $K = \hbar c^4 /
(5120 \pi G^2)$, hence

$$M(t)^3 \;=\; M_0^3 \;-\; 3\,K\,t,
  \qquad
  t_{\rm evap} \;=\; \frac{5120 \pi G^2 M_0^3}{\hbar c^4}
                  \;\approx\; 2.1 \times 10^{67}\,\mathrm{yr}\,
                              \Big(\frac{M_0}{M_\odot}\Big)^3.$$

A solar-mass BH lasts $10^{67}$ yr, fantastically longer than the
$10^{10}$ yr age of the universe. Primordial BHs formed in the
early universe at mass $\sim 10^{11}\,\mathrm{kg}$ are evaporating
right now ($t_{\rm evap} \sim 10^{10}\,\mathrm{yr}$) and ending in
gamma-ray flashes which gamma-ray observatories search for.

### Energy budget

The total energy released over the lifetime is $M_0 c^2$, the
rest-mass energy of the BH. Hawking radiation is the only known
mechanism that can convert a BH back into ordinary matter and
radiation: in this sense the entropy and information of the BH
return to the universe (the information-paradox debate).

### Symbols

- $M$: BH mass.
- $r_s = 2GM/c^2$: Schwarzschild horizon radius.
- $T_H = \hbar c^3 / (8\pi G M k_B)$: Hawking temperature.
- $P_H = \hbar c^6 / (15360 \pi G^2 M^2)$: thermal power.
- $t_{\rm evap} = 5120 \pi G^2 M_0^3 / (\hbar c^4)$: evaporation time.
- $\hbar, c, G, k_B, \sigma$: standard physical constants.

### Things to try

- Set $M = 1\,M_\odot$: $T_H = 6.17 \times 10^{-8}$ K, totally
  undetectable, lifetime $2\times10^{67}$ yr.
- Set $M = 1.7\times10^{11}\,\mathrm{kg}$ (primordial-BH scale):
  $T_H \sim 10^{12}$ K, lifetime $\sim$ age of universe.
- Slide all the way to $10^5$ kg (a kilogram-scale BH): $T_H$ is in
  the MeV range and evaporation in microseconds; the final flash is
  a gamma-ray burst of $\sim 10^{22}$ J.

### Where this comes from

The Hawking-temperature derivation is in Hawking, *Commun. Math.
Phys.* 43 (1975) 199 (`hawking-1975`); the original 4-page
Letter is *Nature* 248 (1974) 30 (`hawking-1974`). The evaporation
formula and the primordial-BH constraints are reviewed in Carr,
*Astrophys. J.* 833 (2016) 61, and Page, *Phys. Rev. D* 13 (1976)
198 (the Stefan-Boltzmann emission integral over all particle
species).
