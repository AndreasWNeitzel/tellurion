---
title: Compton Scattering Kinematics
slug: compton-scattering-kinematics
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2017
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 2
hook: 'Bounce an X-ray off a free electron and it comes back redder; the wavelength shift depends only on the scattering angle, not the photon energy.'
one_paragraph: 'Compton scattering treats light as particles: a photon collides with a free electron, and conservation of energy and momentum forces the scattered photon to lose energy. The wavelength shift is Delta lambda = (h / m_e c)(1 - cos theta), independent of the incident wavelength and set purely by the scattering angle, where h / m_e c = 2.426 pm is the electron Compton wavelength. The playground lets you vary theta and shows the scattered photon, the recoiling electron, and the resulting shift. This angle-only shift was decisive evidence that light carries momentum h / lambda. Reference: Eisberg and Resnick, Quantum Physics, Ch. 2.'
tags: [quantum, animation, live-readout]
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

# Compton scattering kinematics

## Explainer

### What you are looking at

Bounce an X-ray off a loosely held electron and the scattered X-ray
comes back with a longer wavelength, redder. Classical wave theory says
the wavelength should not change at all. It does, and by an amount that
depends only on the scattering angle, not on the incoming wavelength.
That was decisive 1923 evidence that light comes in particles carrying
momentum.

### The kinematics

Treat the photon as a particle with energy $hc/\lambda$ and momentum
$h/\lambda$. Conserve energy and momentum in the photon-electron
collision and the algebra collapses to the Compton shift:

$$\lambda' - \lambda = \frac{h}{m_e c}\,(1 - \cos\theta).$$

The whole right side except $\cos\theta$ is a constant, the electron
Compton wavelength $\lambda_C = h/m_e c = 2.426$ pm. So the wavelength
change depends only on the scattering angle $\theta$: zero straight
ahead, maximal ($2\lambda_C$) for a backscatter. The recoiling electron
carries off the lost energy,

$$T = hc\left(\frac1\lambda - \frac1{\lambda'}\right),$$

and leaves at an angle fixed by $\cot\phi = (1+\alpha)\tan(\theta/2)$
with $\alpha = \lambda_C/\lambda$.

### Why it matters

The shift is independent of the incident wavelength, which is
impossible for a classical wave pushing on a charge but automatic for a
particle collision. It is direct proof of the photon, and the same
kinematics (run in reverse, a fast electron boosting a low-energy
photon) is inverse Compton scattering, a major process in
high-energy astrophysics. The playground sweeps $\theta$ and shows the
scattered photon, the recoil electron, and the $\Delta\lambda(\theta)$
curve.

### Things to try

- Sweep $\theta$ to $180^\circ$ and read off the maximum shift
  $\Delta\lambda = 2\lambda_C \approx 4.85$ pm.
- Change the incident wavelength and confirm $\Delta\lambda$ does not
  move: angle-only, the key surprise.
- Watch the recoil electron take exactly the energy the photon loses.

### Where this comes from

The relativistic energy-momentum conservation and the Compton shift
formula follow Eisberg and Resnick, *Quantum Physics*, 2nd ed.,
Chapter 2, and Carroll and Ostlie, *An Introduction to Modern
Astrophysics*, 2nd ed., Chapter 5.

## Physical setup

A monochromatic photon of wavelength $\lambda$ (typically 0.5 to 10 pm, the X-ray regime where Compton scattering is significant) is incident along the $+x$ axis on a free electron at rest. The photon scatters at angle $\theta$ measured from its original direction. The recoiling electron flies off at angle $\phi$ on the opposite side of the scattering plane.

## Governing equations

Energy and momentum conservation for the photon-electron 4-vector collision yield the Compton shift

$$\lambda' - \lambda = \frac{h}{m_e c} \, (1 - \cos\theta).$$

The constant $h / m_e c = 2.4263102367$ pm is the electron Compton wavelength $\lambda_C$. The recoiling electron carries kinetic energy

$$T = h c \left( \frac{1}{\lambda} - \frac{1}{\lambda'} \right).$$

The electron recoil angle satisfies

$$\cot\phi = (1 + \alpha) \tan(\theta/2), \quad \alpha = \lambda_C / \lambda.$$

## Numerical method

Closed-form evaluation. No time integration; no truncation error. The diagram and the $\Delta\lambda(\theta)$ plot are re-rendered each rAF frame using the current $\lambda$ and $\theta$ sliders.

## Controls

- Incident wavelength $\lambda$ in pm (0.5 to 10, step 0.05).
- Scattering angle $\theta$ in degrees (0 to 180, step 1).
- Sweep button: animates $\theta$ from 0 to 180 over 8 s.
- Reset button: returns to $\lambda = 2.5$ pm, $\theta = 60$ deg.

## Expected qualitative features

1. The scattered-photon arrow (orange) sweeps around the scattering vertex as $\theta$ moves from 0 to 180.
2. The electron arrow (red) sweeps the opposite hemisphere; $\phi \to 0$ as $\theta \to \pi$ and $\phi \to \pi/2$ as $\theta \to 0$.
3. The $\Delta\lambda$ curve is a flipped cosine going from 0 at $\theta = 0$ to $2\lambda_C \approx 4.85$ pm at $\theta = \pi$.
4. The red dot on the curve tracks the current angle.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| forward shift zero | $\Delta\lambda(0) < 10^{-15}$ pm | invariants test |
| backscatter equals $2\lambda_C$ | within $10^{-15}$ pm | invariants test |
| right-angle equals $\lambda_C$ | within $10^{-15}$ pm | invariants test |
| photon energy = scattered photon + electron T | within $10^{-12}$ relative | invariants test |
| electron angle $\phi \to 0$ as $\theta \to \pi$ | $\phi < 10^{-6}$ rad | invariants test |
| electron angle $\phi \to \pi/2$ as $\theta \to 0$ | within $10^{-4}$ rad | invariants test |
| $\cot\phi = (1 + \alpha) \tan(\theta/2)$ | within $10^{-12}$ relative | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $\theta = 0$: $\Delta\lambda = 0$, $T = 0$, electron undisturbed.
- $\theta = \pi$: $\Delta\lambda = 2\lambda_C$, $T$ maximal, electron straight forward.
- $\lambda \gg \lambda_C$: shift $\ll \lambda$, recovers classical Thomson scattering geometry.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional and the figure caption still reads as a paper sentence.

## Citations

- Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 2.

## Stretch goals

- Add Klein-Nishina differential cross section to weight the angular distribution.
- Allow the electron to start with momentum (Doppler broadening, ICS in astrophysics).
- Inverse Compton mode: electron at relativistic gamma, low-energy photon up-scattered.

## Risk register

- Very small $\theta$ leaves the recoil-angle calculation near the $\theta = 0$ branch; the engine returns $\phi = \pi/2$ at exactly $\theta = 0$ for visual continuity.
- $\lambda$ very large (visible light) gives essentially zero shift; the readout shows $\Delta\lambda \ll 1$ pm but the plot still works.
