---
title: Supernova Light Curve
slug: supernova-light-curve-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: [MAA-HE, FIS3030]
curriculum_year: hero
primary_citation: arnett-1982
primary_chapter: 1
hero_candidate: true
hook: 'The brightest stellar explosions in the universe outshine entire galaxies. Their light curve is set by the radioactive decay of nickel-56 cooked in the explosion itself: a few tenths of a solar mass of 56Ni decays through 56Co to 56Fe, releasing 2 x 10^49 erg over a hundred days. That decay-powered luminosity is the standard candle that revealed the accelerating universe.'
one_paragraph: 'A supernova playground built on the Arnett 1982 light-curve model: the fireball expands homologously, releases stored energy as it cools, and is reheated by the radioactive decay chain 56Ni -> 56Co -> 56Fe (half-lives 6.1 d and 77.7 d). The peak luminosity is set by the synthesised 56Ni mass via the Arnett rule (peak when diffusion time equals expansion time). The playground integrates the bolometric L(t) for Type Ia (thermonuclear, M_Ni ~ 0.6 M_sun, peak M_V ~ -19.5, standard candle) and Type II (core collapse with plateau, M_Ni ~ 0.07 M_sun, peak M_V ~ -17), shows the live 3D fireball expanding at ~10^4 km/s, and tracks the Ni / Co / Fe mass partition. Two famous presets: SN 2011fe (Type Ia, the textbook standard candle) and SN 1987A (Type II from a blue supergiant, with the unique mass-coordinate radioactive tail). Reference: Arnett, ApJ 253 (1982) 785; Filippenko, ARA&A 35 (1997) 309.'
caption: 'Figure 1. 3D supernova fireball expanding homologously (left), bolometric light curve L(t) with the 56Ni and 56Co decay tails (right), and the live mass partition Ni -> Co -> Fe (lower right). Method: Arnett 1982 closed-form L_peak rule, exponential decay chain integrated in mass, homologous v(r) = r/t fireball. Source: Arnett, ApJ 253 (1982) 785.'
tags: [supernova, nucleosynthesis, stellar-evolution, animation, three-d, live-readout]
difficulty: 4
tier: hero
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [sn_type, m_ni, preset]
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

# Supernova Light Curve

A radioactive-decay-powered light curve in 3D.
Source: Arnett, *ApJ* 253 (1982) 785; Filippenko,
*ARA&A* 35 (1997) 309; Hillebrandt and
Niemeyer, *ARA&A* 38 (2000) 191.

## Explainer

### What you are looking at

A supernova is the violent death of a star, releasing $\sim 10^{51}$
ergs in kinetic energy and an extended optical light curve over weeks
to months. The light is NOT powered directly by the explosion (that
energy is mostly kinetic). Instead, the fireball is heated from
within by the decay of $^{56}$Ni synthesised in the explosion itself.
The chain is

$$^{56}\mathrm{Ni}
   \xrightarrow{t_{1/2} = 6.1\,\mathrm{d}}
   {}^{56}\mathrm{Co}
   \xrightarrow{t_{1/2} = 77.7\,\mathrm{d}}
   {}^{56}\mathrm{Fe},$$

releasing $\sim 6.45 \times 10^{16}$ erg/g and $\sim 1.14 \times 10^{16}$
erg/g on each step. For 0.6 $M_\odot$ of $^{56}$Ni this is $2 \times
10^{49}$ erg total. The energy deposited by gamma rays and positrons
diffuses out as the optical light curve.

### The Arnett rule

The fireball's luminosity peaks when the diffusion time across it
equals the expansion time:

$$t_{\rm peak} \;\sim\; \sqrt{\frac{2 \kappa M_{\rm ej}}{\beta c v_{\rm ej}}}
   \;\sim\; 15 \,\mathrm{d}\;\left(\frac{M_{\rm ej}}{1\,M_\odot}\right)^{3/4}
   \left(\frac{v_{\rm ej}}{10^4\,\mathrm{km/s}}\right)^{-1/2}.$$

At that moment Arnett (1982) showed the bolometric luminosity equals
the instantaneous $^{56}$Ni decay-chain heating rate:

$$L_{\rm peak} \;=\; M_{\rm Ni}\,
   \big(\epsilon_{\rm Ni}\,e^{-t_{\rm peak}/\tau_{\rm Ni}}
      + \epsilon_{\rm Co}\,
        (e^{-t_{\rm peak}/\tau_{\rm Co}} - e^{-t_{\rm peak}/\tau_{\rm Ni}})\big),$$

with $\tau_{\rm Ni} = 6.1\,\mathrm{d}/\ln 2 \approx 8.8\,\mathrm{d}$
and $\tau_{\rm Co} = 77.7\,\mathrm{d}/\ln 2 \approx 111.3\,\mathrm{d}$.
For a Type Ia with $M_{\rm Ni} \approx 0.6\,M_\odot$ this gives
$L_{\rm peak} \approx 10^{43}\,\mathrm{erg/s}$, peak absolute magnitude
$M_V \approx -19.5$. The fact that $L_{\rm peak}$ depends almost
entirely on $M_{\rm Ni}$, and $M_{\rm Ni}$ in Type Ia is set by a
near-universal Chandrasekhar-mass thermonuclear runaway, is what
makes Type Ia a standard candle.

### Two types

- **Type Ia (thermonuclear)**: a CO white dwarf accretes from a
  companion until it ignites a thermonuclear runaway. Standard candle
  ($M_V = -19.5$). Used to measure the accelerating expansion of the
  universe (Riess et al. 1998, Perlmutter et al. 1999).
- **Type II (core collapse)**: a massive star (M > 8 M_sun) burns up
  to iron, collapses to a proto-neutron star, and ejects its envelope.
  Variable peak brightness ($M_V \approx -16$ to $-17$); a long
  "plateau" near peak before the radioactive tail takes over. SN1987A
  is the canonical nearby Type II.

### The fireball

In free expansion ("homologous expansion"), every shell has speed
$v(r) = r / t$: the outer ejecta are fastest, the inner ones slowest,
so $r(t) = v t$ scales linearly with time. After a few weeks the
fireball is $\sim 10^{15}\,\mathrm{cm}$ across ($\sim 70\,\mathrm{AU}$
or $\sim 0.001\,\mathrm{pc}$), moving at $\sim 10^4\,\mathrm{km/s}$.
The playground shows a 3D depth-sorted fireball that grows in size
and dims as the light curve evolves.

### Symbols

- $M_{\rm Ni}$: synthesised $^{56}$Ni mass (in $M_\odot$).
- $\tau_{\rm Ni} = 8.8\,\mathrm{d}$, $\tau_{\rm Co} = 111.3\,\mathrm{d}$: e-folding times.
- $\epsilon_{\rm Ni} = 3.9 \times 10^{10}\,\mathrm{erg\,s^{-1}\,g^{-1}}$.
- $\epsilon_{\rm Co} = 6.78 \times 10^{9}\,\mathrm{erg\,s^{-1}\,g^{-1}}$.
- $v_{\rm ej} \sim 10^4\,\mathrm{km/s}$: ejecta speed.
- $M_{\rm ej}$: total ejecta mass.

### Things to try

- Type Ia preset (SN 2011fe): $M_{\rm Ni} = 0.6\,M_\odot$; peak
  $M_V = -19.5$ at $t \approx 18\,\mathrm{d}$ post-explosion.
- Type II preset (SN 1987A): $M_{\rm Ni} = 0.07\,M_\odot$; the
  radioactive tail is the dominant feature after $\sim 130\,\mathrm{d}$.
- Slide $M_{\rm Ni}$: the entire light curve scales linearly in
  luminosity but its shape stays the same. This is the Arnett rule
  in action.

### Where this comes from

Arnett, *ApJ* 253 (1982) 785 derived the Arnett rule.
The Type-Ia / Type-II classification and the canonical light-curve
phenomenology are reviewed in Filippenko, *ARA&A* 35 (1997) 309. Hillebrandt and Niemeyer, *ARA&A* 38
(2000) 191 review the Type Ia
thermonuclear runaway. The original SN1987A discovery is West et al.,
*A&A* 177 (1987) L1.
