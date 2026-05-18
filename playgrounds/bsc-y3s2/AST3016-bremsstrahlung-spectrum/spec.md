---
title: Thermal Bremsstrahlung Spectrum
slug: bremsstrahlung-spectrum
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3016
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: rybickilightman1979
primary_chapter: 5
hook: 'Hot electrons swerving past ions radiate a spectrum that is flat up to the thermal energy kT, then drops exponentially: the glow of a million-degree plasma.'
one_paragraph: 'Thermal bremsstrahlung (braking radiation) is emitted when free electrons in a hot ionized gas are deflected by ions. Summed over a Maxwellian electron distribution, the emitted spectrum is nearly flat in power per unit frequency up to photon energies h nu around kT, then cuts off exponentially as exp(-h nu / kT). The playground sweeps the plasma temperature and shows the spectrum with its flat part and exponential knee, the diagnostic that gives the temperature of galaxy-cluster gas and accretion plasmas from their X-ray spectra. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 5.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Thermal bremsstrahlung
Flat below $h\nu = kT$, exponential cutoff above. Source: Rybicki-Lightman Ch. 5 (`rybickilightman1979`).

## Explainer

### What you are looking at

Hot ionized gas glows even with no spectral lines: free electrons
swerving past ions emit "braking radiation" (bremsstrahlung). Its
spectrum has a distinctive shape, flat then a sharp exponential cliff,
and the cliff position is a thermometer. This is how the
million-degree gas in galaxy clusters and accretion flows is measured
from X-rays.

### Where the spectrum shape comes from

A single electron-ion encounter radiates a broad pulse. Summing over
all impact parameters gives an emission roughly flat in power per unit
frequency at low energies. Then average over a thermal (Maxwellian)
electron distribution: an electron can only emit a photon up to its own
kinetic energy, so photons with $h\nu \gg kT$ require rare fast
electrons and are exponentially suppressed. The thermal bremsstrahlung
emissivity is

$$\varepsilon_\nu \;\propto\; n_e n_i\,T^{-1/2}\,
  e^{-h\nu/kT}\,\bar g_\text{ff},$$

(with $\bar g_\text{ff}$ a slowly varying Gaunt factor). The result:
nearly flat for $h\nu \lesssim kT$, then an exponential cutoff above.

### The temperature thermometer

The single observable that matters is the cutoff: the spectrum bends
down at $h\nu \approx kT$, so reading where the X-ray spectrum steepens
gives the gas temperature directly, and the overall normalization
($\propto n_e n_i$) gives the emission measure (how much gas). That is
exactly how cluster gas temperatures and densities are derived from
their X-ray spectra. The playground sweeps the plasma temperature and
shows the flat part and the exponential knee move.

### Things to try

- Raise the temperature and watch the exponential cutoff slide to
  higher photon energy ($h\nu\sim kT$).
- Note the low-energy part stays roughly flat (frequency-independent)
  regardless of $T$.
- Read the cutoff position as a thermometer: that is the cluster-gas
  diagnostic.

### Where this comes from

The single-encounter emission, the thermal average, and the
flat-then-exponential thermal-bremsstrahlung spectrum follow Rybicki
and Lightman, *Radiative Processes in Astrophysics*, Chapter 5.
