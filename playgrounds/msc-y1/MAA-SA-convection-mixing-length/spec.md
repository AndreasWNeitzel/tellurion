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
hook: 'Stars carry heat either by radiation or by boiling blobs of gas; which one operates where, decided by one inequality, controls a star''s structure and radius.'
one_paragraph: 'A layer is unstable to convection by the Schwarzschild criterion when the temperature gradient the radiation would need exceeds the adiabatic one, nabla_rad > nabla_ad (a rising blob stays buoyant). Mixing-length theory closes the problem with one free parameter: a blob travels a distance l = alpha H_P (alpha of order unity, H_P the pressure scale height) before dissolving and releasing its heat, which sets the convective flux and the actual gradient between nabla_ad and nabla_rad. Deep convection is nearly adiabatic and almost independent of alpha, but near the surface (superadiabatic convection) the structure and hence the stellar radius depend sensitively on the chosen alpha, which is why it is calibrated to the Sun. The playground shows the stability criterion and how varying alpha changes the gradient and the surface answer. Reference: Hansen and Kawaler, Stellar Interiors, Chapter 5.'
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
references:
  - "Hansen, Kawaler, Trimble, Stellar Interiors: Physical Principles, Structure, and Evolution, Second ed., Ch. 5."
---
# Mixing-length convection
Schwarzschild criterion + MLT parameter $\alpha = l_m / H_P$. Source: Hansen-Kawaler Ch. 5.

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
