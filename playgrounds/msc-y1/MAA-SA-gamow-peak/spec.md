---
title: The Gamow Peak
slug: gamow-peak
status: verified
audience: portfolio
created: 2026-06-23
primary_uc: MAA-SA
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: clayton
primary_chapter: 4
hook: 'Stars burn through a keyhole: fusion happens only in a narrow energy window where the dwindling Maxwell-Boltzmann tail still overlaps the rising quantum-tunneling probability.'
one_paragraph: 'The thermally averaged thermonuclear reaction rate carries its temperature dependence through the integrand I(E) = exp(-E/kT) exp(-sqrt(E_G/E)), the product of the Maxwell-Boltzmann occupation and the Gamow barrier-penetration factor. This product is sharply peaked at the Gamow energy E0 = (sqrt(E_G) kT / 2)^(2/3), with Gaussian 1/e width Delta = 4 sqrt(E0 kT / 3). At E0 the colliding pair is far out on the Maxwell-Boltzmann tail, where both factors are individually minuscule, so only a tiny fraction of collisions fuse; raising the charges of the nuclei lifts the Coulomb barrier (E_G grows), pushes E0 to higher energy, and demands much higher temperatures. The playground plots the three curves on a shared energy axis, marks E0 and Delta, reports the peak fraction I(E0), and shows the integrated rate against temperature so the steep slope that makes stellar burning self-regulating is explicit. Reference: Clayton, Principles of Stellar Evolution and Nucleosynthesis, Sec. 4-3.'
tags: [stellar, nuclear, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: peak-location
    label: analytic E0 equals numeric argmax of the integrand
    tolerance: 0.02
  - key: rate-increasing
    label: integrated rate increases with temperature
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
what_to_try:
  - Watch the temperature sweep move the Gamow peak and lift the rate by many decades.
  - Switch reactions from p + p to carbon burning and see E0 climb to MeV energies.
  - Read the peak fraction I(E0) to see how rare a successful fusion collision is.
references:
  - "Clayton, Principles of Stellar Evolution and Nucleosynthesis (1983), Sec. 4-3."
  - "Iliadis, Nuclear Physics of Stars (2007), Sec. 3.2.1."
  - "Hansen, Kawaler and Trimble, Stellar Interiors (2004), Sec. 6.2."

---
# The Gamow peak
$I(E)=e^{-E/kT}\,e^{-\sqrt{E_G/E}}$, peaked at $E_0=(\sqrt{E_G}\,kT/2)^{2/3}$. Source: Clayton Sec. 4-3.

## Physical setup

Two positively charged nuclei must approach within the range of the
strong force to fuse, but their mutual Coulomb repulsion forms a barrier
many times taller than a typical thermal energy. Classically nothing
fuses; quantum tunneling lets the rare fast pair through.

## Equations

The number of pairs with relative energy $E$ follows the
Maxwell-Boltzmann distribution, whose high-energy tail is $\propto
e^{-E/kT}$. The probability that such a pair tunnels through the Coulomb
barrier is the Gamow factor

$$P(E) = e^{-\sqrt{E_G/E}}, \qquad
  E_G = 2\,\mu c^2\,(\pi\alpha Z_1 Z_2)^2,$$

with $\mu$ the reduced mass. With a slowly varying astrophysical
$S$-factor the reaction-rate integrand is the product

$$I(E) = e^{-E/kT}\,e^{-\sqrt{E_G/E}},$$

which is maximal at the Gamow energy

$$E_0 = \left(\tfrac12 \sqrt{E_G}\,kT\right)^{2/3},$$

and is well approximated near the peak by a Gaussian of $1/e$ full width

$$\Delta = 4\sqrt{\tfrac{E_0 kT}{3}}.$$

The peak value $I(E_0) = e^{-3E_0/kT}$ is exponentially small, so the
effective fusion window is the narrow band $E_0 \pm \Delta/2$.

## Numerical method

The Maxwell-Boltzmann and penetration factors are closed-form. The
thermally averaged rate (up to the constant $S$-factor and slowly
varying prefactors) is $\int I(E)\,dE$, evaluated by the trapezoid rule
on a fixed grid out to $E_0 + 10\,\Delta$. The local power-law exponent
$\nu = d\ln(\text{rate})/d\ln T$ is a centered finite difference.

## Controls

- reaction: selects $Z_1, Z_2, A_1, A_2$ (p+p, p+$^{14}$N, $^3$He+$^3$He, $\alpha+^{12}$C, $^{12}$C+$^{12}$C).
- log$_{10}T$: central temperature; auto-sweeps within a band around each reaction's characteristic value.
- Reset, Pause.

## Expected qualitative features

- The product peak sits to the right of the falling Maxwell-Boltzmann
  curve and to the left of where the penetration factor saturates.
- Raising $T$ moves $E_0$ to higher energy and widens $\Delta$.
- Heavier (higher-$Z$) reactions have larger $E_G$, a peak at much
  higher energy, and require higher temperatures to reach an
  appreciable rate.
- The rate-versus-temperature curve is a steep near-exponential, giving
  the large $\nu$ that makes stellar burning self-regulating.

## Invariants and acceptance

- The analytic $E_0$ equals the numerical argmax of $I(E)$ to better
  than 2 percent.
- $\int I(E)\,dE$ increases monotonically with $T$ over the displayed
  range.
- All reported quantities remain finite for every control setting.

## Explainer

### What you are looking at

The blue curve is the Maxwell-Boltzmann factor: how many ion pairs have
relative energy $E$. It falls steeply, because high-energy collisions
are rare. The gold curve is the tunneling probability: it rises with
energy, because a faster pair penetrates the Coulomb barrier more
easily. Fusion needs both, so the rate is set by their product, the
magenta Gamow peak. The peak is normalised to its own maximum for
visibility; the header reports the true peak fraction $I(E_0)$, which is
exponentially small.

### Why it matters

The peak is narrow and its height is a near-exponential function of
temperature, so the integrated rate climbs by orders of magnitude for a
small temperature rise. That steep slope is the stellar thermostat: a
slight contraction heats the core, the rate jumps, the extra pressure
halts the contraction. It also sets which fuel burns where, since the
heavier-nucleus reactions only switch on once the core is hot enough to
move $E_0$ up to their much higher Gamow energies.

### Where this comes from

Clayton, *Principles of Stellar Evolution and Nucleosynthesis* (1983),
Sec. 4-3; Iliadis, *Nuclear Physics of Stars* (2007), Sec. 3.2.1;
Hansen, Kawaler and Trimble, *Stellar Interiors* (2004), Sec. 6.2.
