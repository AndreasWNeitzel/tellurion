---
title: Mixing-Length Convection
slug: convection-mixing-length
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-SA
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hansen-kawaler
primary_chapter: 5
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Mixing-length convection
Schwarzschild criterion + MLT parameter $\alpha = l_m / H_P$. Source: Hansen-Kawaler Ch. 5 (`hansen-kawaler`).

## Explainer

### What you are looking at

Stars carry heat either by radiation (photons diffusing out) or by
convection (boiling blobs of gas). Which one operates where, and how
efficiently, controls a star's structure and radius. Mixing-length
theory is the crude-but-universal recipe stellar models use for
convection. The playground shows the stability criterion and how the
one free parameter changes the answer.

### When does convection start?

A gas blob displaced upward keeps rising only if it stays less dense
(hotter) than its new surroundings. Comparing the blob's adiabatic
cooling to the ambient temperature gradient gives the Schwarzschild
criterion: a layer is convective when the radiative gradient exceeds
the adiabatic one,

$$\nabla_\mathrm{rad} > \nabla_\mathrm{ad},
  \qquad \nabla \equiv \frac{d\ln T}{d\ln P}.$$

Radiative zones are stably stratified; convective zones overturn.
This single inequality decides, layer by layer, which transport
mechanism a star uses.

### Mixing-length theory

In a convective zone we still need the actual gradient and the heat
flux. MLT assumes a blob rises a characteristic distance, the mixing
length, before dissolving:

$$\ell_m = \alpha\,H_P,
  \qquad
  H_P = -\frac{dr}{d\ln P}
  = \frac{P}{\rho g},$$

set as a multiple $\alpha$ of the pressure scale height $H_P$. The
convective flux then scales as

$$F_\mathrm{conv}
  \;\propto\; \rho\,c_P\,T\,
  \big(\nabla - \nabla_\mathrm{ad}\big)^{3/2}
  \left(\frac{\ell_m}{H_P}\right)^{2},$$

so a larger $\alpha$ means more efficient convection, a shallower
super-adiabatic gradient, and a more compact star. $\alpha$ is not
predicted by the theory; it is calibrated (typically $\alpha\sim1.5$
to $2$ from a solar model) and then assumed universal, which is the
single biggest structural uncertainty in 1D stellar models. The
playground sweeps $\alpha$ and the gradients and shows the
Schwarzschild boundary move and the convective efficiency change.

### Things to try

- Adjust the radiative gradient until it crosses
  $\nabla_\mathrm{ad}$ and watch the layer flip between radiative
  and convective (the Schwarzschild criterion).
- Increase $\alpha$ and watch convection carry the flux with a
  smaller super-adiabatic excess (more efficient transport).
- Note that in the deep interior even a tiny
  $\nabla-\nabla_\mathrm{ad}$ carries the flux, while near the
  surface the excess is large (inefficient convection).

### Where this comes from

The Schwarzschild criterion and mixing-length theory follow Hansen,
Kawaler and Trimble, *Stellar Interiors*, Chapter 5, and
Bohm-Vitense, ZAp 46, 108 (1958).
