---
title: "Monte Carlo Photon Transport in a Tissue Slab"
slug: monte-carlo-photon-transport
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MFM-MP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: attix1986
hook: 'Monoenergetic photons enter a water slab and are tracked by Monte Carlo: each is transported a sampled free path 1/mu, then photoelectrically absorbed, Compton-scattered or Rayleigh-scattered by the energy-dependent cross sections; the freed electrons deposit dose a short distance forward, producing the characteristic build-up.'
one_paragraph: 'A Monte Carlo photon-transport playground (Klein and Nishina 1929; Attix 1986). Photons normally incident on a water slab are followed history by history: a free path is sampled as -ln(U)/mu, the interaction type is drawn from the photoelectric, Compton and Rayleigh cross sections, Compton scattering is sampled from the Klein-Nishina distribution by Kahns method, and the released electron energy is deposited over a forward CSDA range, which produces the depth-dose build-up before the exponential falloff. Panel A shows the photon histories coloured by interaction type, Panel B the depth dose and the 2D dose map, Panel C the interaction fractions versus energy and the energy balance. The sampled mean free path follows 1/mu, the photoelectric-to-Compton dominance crosses over with energy, energy is conserved history by history, and the depth dose shows the build-up before the Beer-Lambert falloff. Reference: Attix, Introduction to Radiological Physics, Chapters 7 to 8; Klein and Nishina 1929.'
tags: [medical-physics, monte-carlo, photon-transport, dosimetry, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [e, L, n]
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

# Monte Carlo Photon Transport in a Tissue Slab

## Explainer

### What you are looking at

X-rays entering tissue do not just attenuate, the dose actually rises
for the first centimeter before falling, because scattered electrons
carry energy forward. The only honest way to predict that is to follow
millions of individual photons by Monte Carlo. The playground traces
photon histories and tallies the depth-dose, the workhorse of medical
physics.

### Sampling the photon path

Between interactions a photon flies a free path drawn from the
exponential attenuation law (invert the Beer-Lambert CDF):

$$s = -\frac{\ln U}{\mu}, \qquad U \sim \mathrm{Uniform}(0,1),$$

with $\mu$ the linear attenuation coefficient. At each interaction it
picks photoelectric absorption ($\propto E^{-3}$), Compton scattering,
or Rayleigh scattering ($\propto E^{-2}$) in proportion to their cross
sections, which is why the dominant process changes with energy.

### Compton scattering and the dose build-up

A Compton scatter shifts the photon to

$$E' = \frac{E}{1 + (E/m_ec^2)(1 - \cos\theta)},$$

with the angle drawn from the Klein-Nishina distribution (Kahn
rejection). The recoil electron is not deposited at the interaction
point; it ranges forward over the CSDA range
$R \approx 0.412\,E_\mathrm{MeV}^{1.27}$ g/cm$^2$, depositing dose
slightly downstream. That forward energy transport is exactly why the
depth-dose curve builds up to a maximum before the uncollided fluence
$e^{-\mu x}$ pulls it back down, the clinically crucial "skin-sparing"
build-up region. Energy is booked exactly into deposited, transmitted,
backscattered and leaked channels (a conservation check).

### Things to try

- Watch the depth-dose rise to a peak then fall (build-up then
  attenuation), not a pure exponential.
- Lower the energy and watch photoelectric absorption take over
  (sharper, shallower dose); raise it and Compton dominates.
- Confirm the energy tallies sum to the incident energy (Monte Carlo
  conservation).

### Where this comes from

Monte Carlo photon transport, Klein-Nishina sampling, and the CSDA
build-up follow Attix, *Introduction to Radiological Physics*, and
Bielajew, *Fundamentals of the Monte Carlo Method*.

## Physical setup

A pencil beam of monoenergetic photons normally incident on a slab of water (tissue equivalent). Each photon is transported by Monte Carlo: it travels a randomly sampled distance, then interacts by photoelectric absorption, Compton scattering or Rayleigh scattering, chosen in proportion to the cross sections. Compton scattering reduces the photon energy and changes its direction; the energy given to electrons is deposited slightly downstream, which is why the dose builds up before it attenuates. The relative importance of the three processes is strongly energy dependent.

## Governing equations

The free path is sampled from the exponential attenuation law, s = -ln(U)/mu, with mu the linear attenuation coefficient (Compton from the Klein-Nishina total cross section times the electron density, photoelectric ~ 1/E^3, Rayleigh ~ 1/E^2, calibrated to water). The Compton scattered energy follows the Klein-Nishina distribution, sampled by Kahns rejection method, with E' = E/(1 + (E/m_e c^2)(1 - cos theta)) bounded below by the Compton edge E/(1 + 2E/m_e c^2). The released electron deposits its energy over the Katz-Penfold CSDA range R ~ 0.412 E_MeV^1.27, giving the dose build-up. Uncollided fluence falls as e^{-mu x} (Beer-Lambert).

## Numerical method

A seeded xoshiro128 RNG (default 0xC0FFEE) drives the path, interaction-type and Klein-Nishina sampling. Each history is followed until absorption, escape, or the photon energy drops below 1 keV. Energy is booked exactly into deposited, transmitted, backscattered and side-leak channels. A bounded set of histories is recorded for the visualisation; the depth dose, dose map and tallies are aggregates. Deterministic for a given seed.

## Controls

- `e`: photon energy, 16 keV to 5 MeV (log slider). Sets the cross sections and the dominant interaction.
- `L`: slab thickness, 4 to 30 cm. A thinner slab transmits more (Beer-Lambert).
- `n`: number of histories, 2000 to 20000. More histories reduce the Monte Carlo noise.
- Reset, Pause/Play. Pause freezes the history-reveal animation; the aggregates are static.

## Expected qualitative features

- At low energy the interactions are mostly photoelectric (red) and the photons are absorbed near the surface; at high energy they are Compton (cyan) and penetrate.
- The depth dose builds up to a maximum a short distance in, then attenuates roughly exponentially.
- The interaction-fraction panel: photoelectric dominating below ~30 keV, Compton above, Rayleigh always minor.
- A thinner slab or higher energy transmits a larger fraction of the energy.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. The water mu is physical (~0.38, 0.17, 0.07 /cm at 30, 100, 1000 keV) and equals 1/mfp; mu = pe + compton + rayleigh.
2. The sampled first-flight free path equals 1/mu within 2 percent.
3. Photoelectric dominates at 20 keV, Compton (> 0.9) at 1000 keV; Rayleigh always under 0.15; fractions partition unity.
4. Compton sampling respects the Klein-Nishina bounds E/(1+2a) <= E' <= E and reaches both ends; |cos theta| <= 1.
5. Energy is conserved exactly: deposited + transmitted + backscattered + side leak = input.
6. The depth dose peaks below the surface (build-up) then attenuates; the CSDA range grows with energy.
7. A thinner slab transmits more energy than a thicker one.
8. Determinism: same seed reproduces the result; a different seed differs.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Low energy: photoelectric absorption near the surface, almost no transmission.
- High energy: Compton-dominated, deep penetration, substantial transmission.
- Forward Compton (cos theta -> 1): E' -> E; backscatter: E' -> the Compton edge.
- Thin slab: transmitted fraction -> 1; thick slab: deposited fraction grows.

## Visual fallback

The depth dose, dose map and fraction curves are static reads; the streaming-in of histories is animation only.

## Citations

- Klein, O. and Nishina, Y., Uber die Streuung von Strahlung..., Z. Phys. 52, 853 (1929): the Compton cross section.
- Attix, F. H., Introduction to Radiological Physics and Radiation Dosimetry (1986): interaction coefficients, attenuation, build-up.

## Stretch goals

- Add coherent (Rayleigh) form factors and a layered (bone/lung) phantom.
- Move the histories to a Web Worker and raise the photon count for smoother statistics.

## Risk register

- The photoelectric and Rayleigh coefficients are simple power laws calibrated to water near 30-100 keV, not full tabulated data; the load-bearing checks are the mean-free-path law, the energy-dependent dominance, the Klein-Nishina bounds and exact energy conservation. The displayed depth dose is lightly smoothed to read the build-up through Monte Carlo noise; the raw histogram drives the invariants.
