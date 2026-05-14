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
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, fluids-mhd, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Inverse-Compton cooling

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
