---
title: "Gravitational Lensing: Microlensing and Caustics"
slug: gravitational-microlensing-event
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'Drag a background source behind a star: its lensed images slide along the critical curve, an Einstein ring flashes at alignment, and the magnification traces a Paczynski bump or, for a binary lens, sharp caustic spikes.'
one_paragraph: 'Interactive gravitational lensing. The image plane is the main view: the lens (single point mass or a binary), its critical curve, the source-plane caustic, and the lensed images found from the lens equation beta = theta - sum m_i (theta - z_i)/|theta - z_i|^2. Drag or let the source drift; the diagnostic strip shows the total magnification, the single-lens Paczynski bump A(u) = (u^2+2)/(u sqrt(u^2+4)) or the steep caustic-crossing spikes of a binary lens. Merges the former microlensing-event and lensing-caustics playgrounds.'
tags: [relativity, gr-relativity, animation, live-readout]
difficulty: 3
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
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

# Gravitational Microlensing Event

Top half is a 200-star procedural field; one star is the source (with a faint Einstein-radius ring), another is the lens moving across the field. As the lens approaches the source the user sees the two distorted images flanking it, an Einstein ring flash at zero impact parameter, and the characteristic Paczynski bump in the bottom-half light curve. A binary-lens toggle adds caustic-crossing spikes.

## Explainer

### What you are looking at

A foreground star drifts in front of a background star. Its gravity
bends the light, splitting and magnifying the background star so it
temporarily brightens, then fades, a smooth symmetric bump. No light is
created; the same flux is just focused toward us. This is how dark,
planet-mass objects are detected across the Galaxy.

### The magnification

The lens deflects light so the background star appears as two images on
either side of the Einstein ring (angular radius $\theta_E$). Their
combined brightness, relative to unlensed, depends only on the
projected separation $u$ (in units of $\theta_E$):

$$A(u) = \frac{u^2 + 2}{u\sqrt{u^2 + 4}}.$$

As the lens passes, $u$ traces

$$u(t) = \sqrt{u_\min^2 + \left(\frac{t - t_\text{peak}}{t_E}\right)^2},$$

so the light curve is the symmetric Paczynski bump: peak magnification
$A(u_\min)$ at closest approach, width set by the Einstein crossing
time $t_E$. A smaller minimum impact parameter $u_\min$ gives a higher,
sharper peak; $u_\min\to0$ gives a brief full Einstein-ring flash.

### Why it matters, and the binary case

The bump is achromatic (same in every color) and symmetric, which
distinguishes microlensing from intrinsic variable stars. It probes
otherwise-invisible masses (brown dwarfs, free-floating planets, MACHO
dark matter). A binary lens (a star with a planet) adds caustics,
closed curves of formally infinite magnification, so the light curve
picks up sharp extra spikes when the source crosses them: that is how
microlensing finds exoplanets. The playground animates the lens
crossing, the split images and Einstein ring, the Paczynski light
curve, and the binary caustic spikes.

### Things to try

- Lower $u_\min$ toward 0 and watch the peak shoot up and an Einstein
  ring flash appear.
- Change $t_E$ and watch the bump widen or narrow (longer crossing
  time, broader event).
- Toggle the binary lens and catch the sharp caustic-crossing spikes,
  the planet signature.

### Where this comes from

The point-lens magnification $A(u)$, the Einstein radius, and the
Paczynski light curve follow Paczynski (1986), ApJ 304, 1, and
Schneider, Ehlers and Falco, *Gravitational Lenses*.

## Physical setup

Single-lens magnification $A(u) = (u^2 + 2)/(u\sqrt{u^2 + 4})$ with $u(t) = \sqrt{u_\min^2 + ((t-t_\mathrm{peak})/t_E)^2}$. Image positions $\theta_\pm = \tfrac{1}{2}(u \pm \sqrt{u^2 + 4}) \theta_E$. Binary lens: Chang-Refsdal in the $q \ll 1$ limit; full Newton iteration on the complex polynomial for general $q$.

## Controls

- $\theta_E$ slider, source/lens distance, lens transverse velocity
- Finite-source size toggle (point vs uniform disk)
- Binary-lens mass-ratio slider (adds the second component)

## Invariants

- For $u_\min = 0.3$ and $t_E = 30$ d, peak $A = 3.46$ within 1%.
- Single-lens light curve is symmetric about $t_\mathrm{peak}$ to machine precision.
- Binary-lens caustic ($\det J = 0$) closes within one period to within numerical tolerance.

## Status note

Scaffolded with single + binary lens physics; Newton solver for binary case + finite-source convolution not yet implemented.

## Citations

Paczynski 1986, ApJ 304, 1 (`paczynski1986`).
