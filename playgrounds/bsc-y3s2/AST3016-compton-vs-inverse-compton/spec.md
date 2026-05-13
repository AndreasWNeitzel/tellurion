---
title: Compton vs Inverse Compton
slug: compton-vs-inverse-compton
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3016
supporting_ucs: [MAA-HE]
curriculum_year: bsc-y3s2
primary_citation: rybickilightman1979
primary_chapter: 7
---

# Compton vs inverse Compton

## Physical setup

Two photon-electron scattering channels on the same energy axis.

- Forward Compton: photon $E$ scatters off an electron at rest. Maximum (backscatter) shift gives $E' = E / (1 + 2 E/m_e c^2)$.
- Inverse Compton: relativistic electron at $\gamma$ up-scatters a photon $E$ to typical $E_\text{typ} = (4/3) \gamma^2 E$ in the Thomson limit; maximum $E_\text{max} = 4 \gamma^2 E / (1 + 4 \gamma E / m_e c^2)$.

## Governing equations

The forward Compton shift is the textbook closed form. Inverse Compton uses the relativistic Compton formula in the head-on backscatter geometry and the Thomson limit. The regime check $\gamma E < 0.1 m_e c^2$ tells whether Klein-Nishina suppression matters.

## Numerical method

Closed-form. The plot uses a single log-energy axis from $10^{-6}$ eV (radio) to $10^{14}$ eV (TeV) with band shading for radio, optical, X-ray, and gamma.

## Controls

- $\log_{10}(E_\text{in}/\mathrm{eV})$ from -6 to 6.
- $\log_{10}\gamma$ from 0 to 8.

## Expected qualitative features

1. Forward Compton (orange) sits just below the input energy.
2. Inverse Compton (accent) sits up to $4\gamma^2$ times the input.
3. Increasing $\gamma$ shifts the IC marker rightward by $\Delta\log_{10}E = 2\log_{10}\gamma$.
4. Increasing input $E$ moves all three markers together until KN suppression curves the IC point.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| forward Compton at $\theta = 0$ gives no shift | within $10^{-8}$ | invariants test |
| backscatter $E' = E / (1 + 2 E/m_e c^2)$ | within $10^{-12}$ | invariants test |
| IC Thomson typical $= (4/3) \gamma^2 E$ | within $10^{-12}$ | invariants test |
| IC max in Thomson limit equals $4 \gamma^2 E$ | within $10^{-3}$ | invariants test |
| gamma = 10, optical photon: $E_\text{max}$ in 50-500 eV | strict | invariants test |
| isThomsonRegime classifies $\gamma = 10$, $E = 1$ eV as Thomson | strict | invariants test |
| suppressionFactor $\approx 1$ in Thomson limit | within $10^{-4}$ | invariants test |
| 511 keV photon backscatter equals $m_e c^2 / 3$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $\gamma \to 1$ with $E \ll m_e c^2$: IC scattering reduces to elastic Thomson.
- $\gamma E \to m_e c^2$: KN suppression caps the up-shift.
- $\gamma = 10^4$, $E = 6 \times 10^{-4}$ eV (CMB): IC produces ~100 keV X-rays (canonical hot intracluster gas).

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 7 (`rybickilightman1979`).
- Companion playground: `compton-scattering-kinematics` for the bare elastic geometry.

## Stretch goals

- Multiple-scattering Comptonization (Comptonization spectrum y-parameter).
- Synchrotron-self-Compton: photons emitted by synchrotron up-scattered by the same electron population.
- Pair-production absorption above the threshold.

## Risk register

- The Klein-Nishina suppression formula here is the simplest interpolation, not the rigorous Klein-Nishina cross section; the readout label flips to "Klein-Nishina" without claiming quantitative accuracy in that regime.
