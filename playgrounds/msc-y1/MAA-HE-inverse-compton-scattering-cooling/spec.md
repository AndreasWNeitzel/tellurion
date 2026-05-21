---
title: Inverse-Compton Cooling
slug: inverse-compton-scattering-cooling
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-HE
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: rybickilightman1979
primary_chapter: 7
hook: 'Reverse Compton scattering: a fast electron slams a low-energy photon up to X-ray or gamma-ray energies and bleeds its own energy away, the engine behind high-energy radiation from jets and the cosmic web.'
one_paragraph: 'A relativistic electron of Lorentz factor gamma immersed in a radiation field of energy density U_rad loses energy by inverse-Compton scattering at the rate -dE/dt = (4/3) sigma_T c gamma^2 beta^2 U_rad (Thomson regime), the same form as synchrotron with the magnetic energy density replaced by U_rad. Because the loss scales as gamma^2, high-energy electrons cool fastest, so an injected population steepens and develops a cooling break; the characteristic cooling time is t_IC proportional to 1 / (gamma U_rad). The playground integrates a single electron''s energy (and an injected spectrum) as it cools, showing the gamma^2 dependence and the build-up of the upscattered high-energy photons. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Chapter 7.'
tags: [stellar, fluids-mhd, animation, live-readout]
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

# Inverse-Compton cooling

## Explainer

### What you are looking at

In ordinary Compton scattering a photon gives energy to an electron.
Reverse it: a fast electron slamming into a low-energy photon kicks
the photon up to X-ray or gamma-ray energies, and the electron cools.
This inverse-Compton process is how relativistic electrons in jets
and the cosmic web produce high-energy radiation. The playground
follows the electron's energy bleeding away.

### The cooling rate

A relativistic electron of Lorentz factor $\gamma$ moving through a
radiation field of energy density $U_\mathrm{rad}$ scatters photons
and loses energy at the rate

$$-\frac{dE}{dt}
  = \frac{4}{3}\,\sigma_T\,c\,\gamma^2\beta^2\,U_\mathrm{rad},$$

where $\sigma_T$ is the Thomson cross section and $\beta=v/c$. The
crucial feature is the $\gamma^2$: the most energetic electrons cool
fastest. Each scattering boosts a seed photon's energy by roughly a
factor $\gamma^2$, so a $\gamma\sim10^4$ electron turns an optical
photon into a gamma ray.

### The cooling time and the cooling break

Since $E=\gamma m_ec^2$, integrating gives a cooling time that
shortens with energy,

$$t_\mathrm{cool}
  = \frac{E}{|dE/dt|}
  \;\propto\;\frac{1}{\gamma\,U_\mathrm{rad}},$$

so a population of electrons injected with a power-law spectrum
develops a "cooling break": above the energy where $t_\mathrm{cool}$
equals the source age, electrons have already radiated away their
energy and the spectrum steepens by exactly one power. This break is
a direct clock on the source. Inverse Compton competes with
synchrotron loss; their ratio is just $U_\mathrm{rad}/U_B$ (the
Compton dominance), which is why the same electrons make both a
synchrotron and an inverse-Compton spectral hump in blazars. The
playground sweeps $\gamma$ and $U_\mathrm{rad}$ and shows the energy
decay and the $\gamma^2$ acceleration of cooling.

### Things to try

- Double $\gamma$ and watch the cooling rate quadruple (the
  $\gamma^2$ law) and the cooling time halve.
- Raise the radiation energy density and watch the electron cool
  proportionally faster.
- Note how a high-$\gamma$ electron drops quickly then lingers at
  low energy (the cooling break in a population).

### Where this comes from

The inverse-Compton power, the $\gamma^2$ scaling, and the cooling
break follow Rybicki and Lightman, *Radiative Processes in
Astrophysics*, Chapter 7, and Blumenthal and Gould, Rev. Mod. Phys.
42, 237 (1970).

## Physical setup

Relativistic electrons (Lorentz factor $\gamma$) immersed in a soft-photon bath (energy density $U_\text{ph}$) lose energy by inverse-Compton up-scattering of the photons. In the Thomson limit the cooling time is
$$t_\text{IC} = \frac{3 m_e c}{4 \sigma_T \gamma U_\text{ph}}.$$

For a thermal bath at temperature $T$, $U_\text{ph} = a T^4$ with $a = 7.566 \times 10^{-16}$ J m$^{-3}$ K$^{-4}$. The CMB at $z = 0$ has $T = 2.725$ K and $U_\text{CMB} \approx 4.17 \times 10^{-14}$ J/m$^3$.

## Numerical method

Closed-form. Log-log plot of $t_\text{cool}(\gamma)$ over $\gamma = 1$ to $10^9$.

## Controls

- $\log_{10}(T / \mathrm{K})$ from 0 to 6.

## Expected qualitative features

1. $t_\text{cool} \propto 1/\gamma$: slope $-1$ on log-log.
2. Increasing $T$ shifts the curve down by $4 \times \Delta\log_{10}T$ (since $U \propto T^4$).
3. At $T = 2.725$ K (CMB), $\gamma = 10^5$ cools in $\sim 10^7$ yr.
4. The dashed red line is the Hubble time $\sim 1.4 \times 10^{10}$ yr; electrons with $t_\text{cool}$ below this line have cooled within the age of the universe.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| CMB $U_\text{ph}$ at $z = 0$ is $\sim 4.17 \times 10^{-14}$ J/m$^3$ | within 1 percent | invariants test |
| CMB $U_\text{ph} \propto (1 + z)^4$ | within $10^{-12}$ | invariants test |
| $t_\text{cool} \propto 1 / \gamma$ | within $10^{-12}$ | invariants test |
| $t_\text{cool} \propto 1 / U_\text{ph}$ | within $10^{-12}$ | invariants test |
| formula matches $3 m_e c / (4 \sigma_T \gamma U)$ | within $10^{-12}$ | invariants test |
| year conversion correct | within $10^{-12}$ | invariants test |
| $\gamma = 2 \times 10^5$ in CMB cools in $10^6$-$10^8$ yr | strict | invariants test |
| higher T bath cools faster | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Klein-Nishina regime ($\gamma E_\text{ph} \gtrsim m_e c^2$): formula breaks down, cooling slows.
- Very low $T$ bath: $U_\text{ph} \to 0$, $t_\text{cool} \to \infty$.
- Synchrotron-IC analogy: $U_\text{ph} \to U_B = B^2/(2 \mu_0)$ in synchrotron case (same formula).

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 7 (`rybickilightman1979`).

## Stretch goals

- Add Klein-Nishina suppression to the formula and show where it kicks in.
- Couple to synchrotron with adjustable magnetic field.
- Pulsar wind nebula geometry with photon and magnetic field profiles.

## Risk register

- The Thomson approximation breaks above $\gamma \sim 10^9$ in the CMB; the curve continues to extrapolate but the readout doesn't flag the regime.
