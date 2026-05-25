---
title: Quasar Relativistic Jet
slug: quasar-relativistic-jet-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3016
supporting_ucs: [FIS3008]
curriculum_year: hero
primary_citation: rybicki-lightman
primary_chapter: 4
hero_candidate: true
hook: 'Look down a relativistic jet and Doppler boost makes it 1000x brighter than the counter-jet. The same engine, seen end-on, looks like a quasar; seen edge-on, a radio galaxy. Both sides of the AGN unification picture in one slider.'
one_paragraph: 'A supermassive black hole launches a bipolar relativistic jet of bulk Lorentz factor Gamma = 1 / sqrt(1 - beta^2) along its rotation axis. An observer at angle theta to the jet axis sees the approaching jet boosted by the Doppler factor delta_+ = 1 / (Gamma (1 - beta cos theta)) and the receding counter-jet dimmed by delta_- = 1 / (Gamma (1 + beta cos theta)). The observed monochromatic flux ratio (F_jet / F_cj)^(3 - alpha) can reach 10^4 for Gamma = 10. The same source viewed end-on is a blazar (BL Lac or FSRQ); viewed edge-on is a radio galaxy. The relativistic motion also produces apparent superluminal proper motion v_app = beta sin theta / (1 - beta cos theta), peaking at cos theta = beta with v_app_max = Gamma * beta c. The playground draws the black-hole disk + twin jets, lets the viewing angle slide from 0 to 90 deg, and shows the boost / counter-boost asymmetry and v_app. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 4.'
caption: 'Figure 1. Doppler-boosted relativistic jet from a supermassive black hole. As the viewing angle theta_obs decreases toward the jet axis, the approaching jet is amplified by delta_+^(3-alpha) and the counter-jet dimmed by delta_-^(3-alpha). The apparent transverse velocity exceeds c when cos theta_obs is close to beta. Method: closed-form Doppler factors with spectral exponent p = 3 - alpha. Source: Rybicki and Lightman, Radiative Processes in Astrophysics, Section 4.8.'
tags: [astrophysics, special-relativity, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [gamma_jet, theta_obs]
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
references:
  - "Rybicki, Lightman, Radiative Processes in Astrophysics, Ch. 4."
---

# Quasar relativistic jet
Doppler boost from a bulk-relativistic flow. Source: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 4; unification scheme: Urry and Padovani, PASP 107 (1995) 803.

## Explainer

### What you are looking at

A supermassive black hole with a glowing accretion disk and a pair of
relativistic jets along the rotation axis. The viewer (you) sits at
angle $\theta_{\rm obs}$ from the jet axis. As $\theta_{\rm obs}$
shrinks toward zero (looking down the jet) the approaching side gets
brighter and brighter while the receding side fades to invisibility.
At $\theta_{\rm obs} = 90^\circ$ (edge-on) both sides have equal
intrinsic brightness, but neither is boosted: this is the standard
radio-galaxy view.

### The Doppler factor

For a flow at speed $\beta c$ with bulk Lorentz factor $\Gamma = 1 /
\sqrt{1-\beta^2}$ viewed at angle $\theta$, the Doppler factor is

$$\delta_\pm(\theta) \;=\; \frac{1}{\Gamma \,(1 \mp \beta \cos\theta)},$$

with $+$ for the approaching jet and $-$ for the counter-jet. The
maximum $\delta$ is at $\theta = 0$ where $\delta_{\rm max} = 2\Gamma$
for $\beta \to 1$. The observed monochromatic flux of a steady jet
scales as

$$F_\nu^{\rm obs}(\theta) \;=\; \delta^{(3 - \alpha)} \, F_\nu^{\rm rest},$$

where $\alpha$ is the spectral index $F_\nu \propto \nu^{-\alpha}$
(Lind and Blandford 1985). With $\Gamma = 10$ and $\alpha = 0.7$, the
jet-to-counter-jet flux ratio at $\theta = 30^\circ$ exceeds 100.

### Apparent superluminal motion

A blob in the jet travels a tangential distance $\beta c \sin\theta \,
\Delta t$ in lab-frame time $\Delta t$. But because the blob also
moves toward us, the light from its later position arrives sooner,
compressing the observed time interval by $(1 - \beta \cos\theta)$.
The result is

$$\beta_{\rm app}(\theta) \;=\; \frac{\beta \sin\theta}{1 - \beta \cos\theta},$$

which exceeds 1 when $\cos\theta \gtrsim \beta$ and peaks at $\cos\theta
= \beta$ with $\beta_{\rm app}^{\rm max} = \beta \Gamma$. For
$\Gamma = 10$, blobs in the jet appear to move at 10c. This is the
classic explanation of superluminal motion in 3C 273, M87, and many
other AGN (Rees 1966; Cohen et al. 1971).

### Unification: blazar vs radio galaxy

Same intrinsic engine, viewed at different angles:
- $\theta_{\rm obs} \lesssim 1/\Gamma$: blazar (BL Lac or FSRQ), highly
  variable, gamma-ray bright.
- $1/\Gamma \lesssim \theta_{\rm obs} \lesssim 45^\circ$: broad-line
  radio quasar.
- $\theta_{\rm obs} \gtrsim 45^\circ$: radio galaxy (FR I or FR II),
  twin jets visible.

This is the Urry and Padovani (1995) unified scheme.

### Symbols

- $\Gamma$: bulk Lorentz factor of the flow ($\Gamma = 1/\sqrt{1-\beta^2}$).
- $\beta$: bulk speed in units of $c$.
- $\theta_{\rm obs}$: viewer's angle from the jet axis.
- $\delta_\pm$: Doppler factor for approaching ($+$) or receding ($-$).
- $\alpha$: spectral index, $F_\nu \propto \nu^{-\alpha}$ (taken $= 0.7$).
- $\beta_{\rm app}$: apparent transverse velocity of a moving blob (in
  units of $c$).

### Things to try

- $\Gamma = 10$, $\theta_{\rm obs} = 5^\circ$: blazar geometry. Flux
  ratio between jets is $\sim 10^4$.
- $\Gamma = 10$, $\theta_{\rm obs} = 6^\circ$ (i.e. cos $\theta \approx
  \beta$): apparent superluminal velocity $\sim 10c$.
- $\Gamma = 2$, $\theta_{\rm obs} = 90^\circ$: edge-on radio galaxy,
  flux ratio = 1.

### Where this comes from

The Doppler-factor derivation and the $\delta^{3-\alpha}$ flux scaling
are in Rybicki and Lightman, *Radiative Processes in Astrophysics*,
Wiley 1979, Section 4.8. The unified scheme is reviewed in Urry and
Padovani, *Publications of the Astronomical Society of the Pacific*
107 (1995) 803. The first superluminal observation was 3C 273 by
Whitney et al., *Science* 173 (1971) 225.
