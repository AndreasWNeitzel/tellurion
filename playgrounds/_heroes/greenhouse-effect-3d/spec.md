---
title: Greenhouse Effect (Hero)
slug: greenhouse-effect-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: [MAA-AB]
curriculum_year: hero
primary_citation: pierrehumbert-pp
primary_chapter: 4
hero_candidate: true
hook: 'Without the greenhouse effect Earth would freeze at 255 K (-18 C). The infrared-opaque atmosphere traps re-emitted radiation and warms the surface to 288 K. Slide the greenhouse opacity from zero (snowball) to one (Venus runaway) and watch the equilibrium temperature swing 200 degrees.'
one_paragraph: 'A radiative-balance laboratory for the greenhouse effect. The Earth absorbs the solar flux S (1 - A) / 4 (geometric factor 1/4 from disk vs sphere area, A is bond albedo), re-emits it as infrared at temperature T_surf. With no atmosphere, T_eff = (S (1 - A) / (4 sigma))^(1/4) = 255 K. A single-layer grey atmosphere with longwave transmissivity tau_LW gives T_surf = T_eff * (2 / (1 + tau_LW))^(1/4): at tau_LW = 0 (opaque IR) we get the well-known 1.19 x boost (288 K for Earth); at tau_LW = 1 (transparent) we collapse to 255 K. The playground draws a 3D Earth + Sun with thousands of photon paths streaming in as visible (cyan) and out as IR (red), with a fraction trapped inside the atmosphere layer. Five presets sweep snowball Earth (T_surf = 220 K), pre-industrial (CO2 = 280 ppm, 287 K), current (420 ppm, 288 K), 2x CO2 (560 ppm, 291 K, IPCC), and Venus runaway (T_surf = 737 K). Reference: Pierrehumbert, Principles of Planetary Climate, CUP 2010, Ch. 4.'
caption: 'Figure 1. 3D Earth + Sun with photon paths (cyan = visible IN, red = thermal IR OUT, some trapped in the atmosphere layer). Right: radiative-balance equation T_surf = T_eff (2 / (1 + tau))^(1/4) over tau in [0, 1] with the current marker. Method: single-layer grey-atmosphere radiative balance, Stefan-Boltzmann emission, geometric 1/4 factor from Earth disk vs sphere. Source: Pierrehumbert, Principles of Planetary Climate, CUP 2010, Ch. 4.'
tags: [climate, planetary, animation, three-d, live-readout]
difficulty: 4
tier: hero
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [preset, co2_ppm, albedo]
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

# Greenhouse Effect

A radiative-balance laboratory for planetary surface temperature.
Source: Pierrehumbert, *Principles of Planetary Climate*, CUP 2010,
Ch. 4; Hansen et al., *Science* 213 (1981) 957; IPCC AR6 WG1 2021.

## Explainer

### What you are looking at

Earth absorbs solar shortwave radiation and re-emits the same energy
as thermal infrared. The simplest model says the planet's surface
temperature is set by the equilibrium between these two flows. If
the atmosphere is transparent to both, the equilibrium is

$$T_{\rm eff} \;=\;
   \left(\frac{S (1 - A)}{4\sigma}\right)^{1/4},$$

where $S = 1361\,\mathrm{W\,m^{-2}}$ is the solar constant,
$A \approx 0.30$ is Earth's bond albedo (fraction reflected), and
$\sigma = 5.67 \times 10^{-8}\,\mathrm{W\,m^{-2}\,K^{-4}}$ is the
Stefan-Boltzmann constant. The factor 1/4 is geometric: the Earth
intercepts solar flux through its disk area $\pi R^2$ but emits over
its full surface $4 \pi R^2$. For Earth this gives $T_{\rm eff} =
255\,\mathrm{K} = -18^\circ\mathrm{C}$. That is freezing; oceans would
be ice. But Earth's actual surface temperature is $288\,\mathrm{K} =
15^\circ\mathrm{C}$. The difference is the greenhouse effect.

### Single-layer grey atmosphere

The textbook simplest model adds one isothermal layer at temperature
$T_{\rm atm}$ that is transparent to shortwave (lets sunlight through)
and partially absorbing in the infrared (longwave transmissivity
$\tau_{\rm LW}$). Energy balance on the layer gives

$$T_{\rm surf} \;=\; T_{\rm eff}
   \left(\frac{2}{1 + \tau_{\rm LW}}\right)^{1/4}.$$

At $\tau_{\rm LW} = 1$ (transparent), $T_{\rm surf} = T_{\rm eff} =
255\,\mathrm{K}$. At $\tau_{\rm LW} = 0$ (fully opaque IR), we get
$T_{\rm surf} = T_{\rm eff} \cdot 2^{1/4} = 1.19 \cdot T_{\rm eff}
\approx 303\,\mathrm{K}$, which overshoots Earth's $288\,\mathrm{K}$
because the real atmosphere is partially transmissive.

### CO2 and the transmissivity

The longwave transmissivity $\tau_{\rm LW}$ depends on the column
abundance of greenhouse gases (H2O, CO2, CH4, N2O, O3). A simple
log-CO2 parametrisation:

$$\tau_{\rm LW}(c) \;=\; \tau_0 \exp\!\big(-\beta \log_2(c/c_0)\big),$$

with $c$ the CO2 concentration (ppm). For Earth, doubling CO2 from
280 to 560 ppm reduces $\tau_{\rm LW}$ by a factor that produces
$\Delta T_{\rm surf} \approx 3\,\mathrm{K}$, the IPCC climate
sensitivity. The playground reproduces this and the other classical
scenarios.

### The Venus runaway

If the atmosphere is thick enough that $\tau_{\rm LW} \to 0$ and
multiple layers stack, the runaway-greenhouse limit drives the
surface temperature high enough to vaporise the entire ocean. Venus
has $T_{\rm surf} = 737\,\mathrm{K}$ and 90 bar of CO2; its
atmosphere is nearly opaque to IR. Earth is presumed to have
narrowly escaped a similar fate by losing its early hydrogen.

### Symbols

- $S = 1361\,\mathrm{W\,m^{-2}}$: solar constant.
- $A$: bond albedo (Earth $\approx 0.30$, snowball $\approx 0.70$, Venus $\approx 0.75$).
- $\sigma = 5.67 \times 10^{-8}\,\mathrm{W\,m^{-2}\,K^{-4}}$: Stefan-Boltzmann constant.
- $T_{\rm eff}$: emission temperature without atmosphere.
- $T_{\rm surf}$: actual surface temperature.
- $\tau_{\rm LW}$: longwave atmospheric transmissivity (0 = fully opaque).
- CO2 concentration in ppm.

### Things to try

- Pre-industrial preset: $T_{\rm surf} = 287\,\mathrm{K}$ at CO2 = 280 ppm.
- 2x CO2 (560 ppm) gives $\Delta T \approx 3\,\mathrm{K}$.
- Snowball: high albedo $\to$ low absorption $\to T_{\rm surf} = 220\,\mathrm{K}$ (ice catastrophe).
- Venus: opaque IR + lowered insolation by albedo, $T_{\rm surf} \to 737\,\mathrm{K}$ (uses a thicker stack of layers in the actual model).

### Where this comes from

Pierrehumbert, *Principles of Planetary Climate*, CUP 2010, Ch. 4, is the standard reference for the
greenhouse-effect derivation in introductory format. The CO2 climate
sensitivity is discussed in Hansen et al., *Science* 213 (1981) 957; the IPCC AR6 report (2021)
synthesises modern observational constraints. The runaway-greenhouse
limit and Venus comparison are in Ingersoll, *J. Atmos. Sci.* 26
(1969) 1191.
