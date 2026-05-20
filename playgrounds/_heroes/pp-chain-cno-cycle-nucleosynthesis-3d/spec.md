---
title: pp Chain vs CNO Cycle (Hero)
slug: pp-chain-cno-cycle-nucleosynthesis-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3014
supporting_ucs: [FIS3008]
curriculum_year: hero
primary_citation: kippenhahn-weigert
primary_chapter: 18
hero_candidate: true
hook: 'The Sun runs on the pp chain; a B-type star runs on the CNO cycle. The crossover is at ~ 18 million K because CNO scales as T^17 while pp only goes as T^4.'
one_paragraph: 'Hydrogen burning in stars proceeds by two distinct nuclear-reaction networks: the proton-proton chain (4 H -> He4, four direct steps starting with p + p -> d + e+ + nu) and the CNO cycle (which uses pre-existing C, N, O nuclei as a catalyst). Both deliver Q = 26.73 MeV per net He synthesis, but their temperature sensitivities differ dramatically: epsilon_pp ~ T^4 while epsilon_CNO ~ T^17. At the Sun''s core (1.55 x 10^7 K) the pp chain dominates by 100:1; above 1.8 x 10^7 K the CNO cycle takes over completely. The playground sweeps core temperature, shows the two reaction networks side by side, and reports the fractional contribution and total epsilon. Reference: Kippenhahn, Weigert and Weiss, Stellar Structure and Evolution, Ch. 18.'
caption: 'Figure 1. pp-chain (left) and CNO-cycle (right) reaction networks with their nuclei. Live bar charts show pp vs CNO fractional contribution as a function of core temperature; the cross-over occurs at T ~ 1.8 x 10^7 K. Method: closed-form epsilon_pp ~ T^4, epsilon_CNO ~ T^17, normalized so the Sun is 99% pp. Source: Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, Ch. 18.'
tags: [stellar, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [T7]
---

# pp chain vs CNO cycle
T^4 vs T^17. Source: Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, Ch. 18 (`kippenhahn-weigert`). Solar-neutrino context: Bahcall, Neutrino Astrophysics, CUP 1989 (`bahcall-neutrino-astrophysics`).

## Explainer

### What you are looking at

Two nuclear-reaction networks side by side. On the left, the
proton-proton chain: four protons turn into a helium-4 nucleus
through three intermediate steps. On the right, the CNO cycle: the
same net reaction but carbon, nitrogen and oxygen nuclei act as
catalysts that come back unchanged at the end. Both release the same
$Q = 26.73\,\mathrm{MeV}$ per net synthesis. The bottom panel shows
which one is doing the work as you sweep the core temperature.

### Why the choice depends on temperature

The energy generation rate of each network has very different
temperature sensitivity:

$$\varepsilon_{\rm pp} \;\propto\; T^4, \qquad
  \varepsilon_{\rm CNO} \;\propto\; T^{17}.$$

The $T^4$ scaling for pp comes from the bottleneck $p + p \to d + e^+
+ \nu_e$, a weak-interaction step. The $T^{17}$ scaling for CNO
reflects the much higher Coulomb barriers (Z = 6, 7, 8 vs Z = 1) that
make the cycle exponentially temperature-sensitive. Setting them
equal,

$$\varepsilon_{\rm pp}(T_*) \;=\; \varepsilon_{\rm CNO}(T_*)
  \quad\Longrightarrow\quad T_* \approx 1.8 \times 10^7\,\mathrm{K},$$

just above the solar core temperature. Below $T_*$, pp dominates;
above $T_*$, CNO takes over and its much steeper temperature
dependence concentrates the burning into a small core volume (which
is one reason massive stars have convective cores).

### The two networks

**pp chain (Sun-like stars):**

1. $p + p \to d + e^+ + \nu_e$ (slow weak step, sets the rate)
2. $d + p \to {}^3{\rm He} + \gamma$
3. ${}^3{\rm He} + {}^3{\rm He} \to {}^4{\rm He} + p + p$ (pp I branch)

There are also pp II and pp III branches via $^7\mathrm{Be}$ and
$^7\mathrm{B}$ that produce the higher-energy solar neutrinos.

**CNO cycle (hot stars):**

The closed loop is $^{12}{\rm C}(p, \gamma)^{13}{\rm N}(e^+\nu_e)
^{13}{\rm C}(p, \gamma)^{14}{\rm N}(p, \gamma)^{15}{\rm O}(e^+\nu_e)
^{15}{\rm N}(p, \alpha)^{12}{\rm C}$. Carbon, nitrogen and oxygen
catalysts shuttle protons in and an alpha particle out, returning to
their starting state at the end.

### Symbols

- $T$: stellar core temperature.
- $T_7 \equiv T / 10^7\,\mathrm{K}$.
- $\varepsilon$: energy generation rate per unit mass (erg/g/s).
- $Q$: net energy released per reaction (26.73 MeV for $4{\rm H} \to
  {}^4{\rm He}$).
- $\nu_e$: electron neutrino, carried off some 2 % of the energy.

### Things to try

- Move the temperature slider through $T_7 = 1.0$ to $4.0$ and watch
  the pp-vs-CNO bar swing from all-pp to all-CNO around
  $T_7 \approx 1.8$.
- Compare the Sun preset ($T_7 = 1.55$, 99 % pp) to an O-star
  ($T_7 \approx 3.5$, 100 % CNO).

### Where this comes from

The classical reaction-network derivation is in Kippenhahn, Weigert
and Weiss, *Stellar Structure and Evolution*, 2nd ed., Springer 2012,
Chapter 18. Solar neutrino physics is in Bahcall, *Neutrino
Astrophysics*, CUP 1989. The $T^4$ vs $T^{17}$ approximations are
useful didactic forms, accurate near $T_7 \sim 1.5$ to 2.0; precise
rates come from the NACRE II compilation (Xu et al., Nucl. Phys. A
918 (2013) 61).
