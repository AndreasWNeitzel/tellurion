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
hook: 'A photon hitting a slow electron loses energy; a photon hit by a fast electron gains a factor gamma-squared. Same physics, opposite direction.'
one_paragraph: 'Compton scattering exchanges energy between photons and electrons, and which way it flows depends on who moves faster. In ordinary forward Compton scattering a photon strikes a nearly-at-rest electron and loses energy, capped at E'' = E / (1 + 2E/m_e c^2) for a head-on bounce. In inverse Compton a relativistic electron of Lorentz factor gamma hits a low-energy photon and boosts it by roughly gamma^2, to E_typ ~ (4/3) gamma^2 E in the Thomson limit. The playground puts both channels on one energy axis as you vary photon energy and gamma, flagging when Klein-Nishina suppression sets in. Inverse Compton powers much of the X-ray and gamma-ray sky. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 7.'
tags: [stellar, animation, live-readout]
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

# Compton vs inverse Compton

## Explainer

### What you are looking at

The same photon-electron collision, run two ways. A photon hitting a
slow electron loses energy (Compton). A relativistic electron hitting a
low-energy photon dumps energy into it, boosting it by $\gamma^2$
(inverse Compton). The playground puts both on one energy axis so the
contrast, and the regime where the simple formulas break, is explicit.

### Forward Compton

A photon of energy $E$ scatters off an electron at rest and comes out
softer; the largest loss is a head-on backscatter:

$$E' = \frac{E}{1 + 2E/m_e c^2}.$$

For X-rays the shift is small; for gamma rays the electron rest energy
$m_e c^2 = 511$ keV sets the scale.

### Inverse Compton

Now the electron is relativistic (Lorentz factor $\gamma$) and the
photon soft. In the electron frame the photon is blueshifted by
$\sim\gamma$, scatters, and is blueshifted again on the way out, a net
boost of $\sim\gamma^2$:

$$E_\text{typ} \approx \tfrac43\,\gamma^2 E
  \quad(\text{Thomson limit}),
  \qquad
  E_\text{max} = \frac{4\gamma^2 E}{1 + 4\gamma E/m_e c^2}.$$

The denominator is the Klein-Nishina correction: once $\gamma E
\gtrsim 0.1\,m_e c^2$ the scattering cross-section drops and the simple
$\gamma^2$ scaling saturates. The playground flags when that regime is
entered.

### Why it matters

Inverse Compton is how cosmic-ray electrons turn starlight and the CMB
into X-rays and gamma rays; it powers blazar high-energy emission and
the Sunyaev-Zeldovich distortion of the CMB. The single picture, same
QED process, opposite energy flow depending on who is faster, ties
laboratory Compton scattering to high-energy astrophysics. The
playground shows both shifted energies versus photon energy and
$\gamma$.

### Things to try

- Hold the electron at rest, raise the photon energy, and watch the
  Compton shift grow toward the $2E/m_ec^2$ regime.
- Make the electron relativistic and watch the photon boosted by
  $\sim\gamma^2$ (inverse Compton).
- Push $\gamma E$ past $\sim0.1\,m_ec^2$ and see the Klein-Nishina
  flag: the $\gamma^2$ law saturates.

### Where this comes from

The Compton shift, the inverse-Compton $\gamma^2$ boost, and the
Klein-Nishina regime follow Rybicki and Lightman, *Radiative Processes
in Astrophysics*, Chapter 7.

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

- Rybicki and Lightman, *Radiative Processes in Astrophysics*, Ch. 7.
- Companion playground: `compton-scattering-kinematics` for the bare elastic geometry.

## Stretch goals

- Multiple-scattering Comptonization (Comptonization spectrum y-parameter).
- Synchrotron-self-Compton: photons emitted by synchrotron up-scattered by the same electron population.
- Pair-production absorption above the threshold.

## Risk register

- The Klein-Nishina suppression formula here is the simplest interpolation, not the rigorous Klein-Nishina cross section; the readout label flips to "Klein-Nishina" without claiming quantitative accuracy in that regime.
