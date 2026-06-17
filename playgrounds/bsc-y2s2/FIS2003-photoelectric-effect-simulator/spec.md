---
title: The Photoelectric Effect
slug: photoelectric-effect-simulator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Crank the light brighter and still nothing happens below the threshold frequency: the experiment that forced energy into quanta.'
one_paragraph: 'The photoelectric effect as a phototube: light of frequency nu strikes a metal cathode and, if h nu exceeds the work function phi, photoelectrons are ejected with K_max = h nu - phi and drift to the anode under the applied voltage. Below the threshold nu0 = phi/h no electrons appear at any intensity, the result classical wave theory could not explain. Raising the intensity adds electrons but never speeds them up; raising the frequency does. The primary scene is the physical phototube; the side panels are the current-voltage curve (cut off at the stopping voltage, saturating with intensity) and the Einstein line V_stop(nu) of universal slope h/e. Reference: Eisberg and Resnick, Quantum Physics of Atoms, 2nd ed., Sections 2.2 to 2.3.'
tags: [quantum, modern-physics, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
primary_citation: eisberg-resnick
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
  - "Eisberg and Resnick, Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles."

---

# The Photoelectric Effect

## Explainer

### What you are looking at

Shine light on a metal and electrons can be knocked out. Classical
wave theory says a bright enough beam should always do it. Experiment
says otherwise: below a threshold colour, no electrons come out no
matter how bright the light. That contradiction forced energy to be
quantised, and the playground lets you reproduce it in a phototube.

### Einstein's photon equation

Light of frequency $\nu$ delivers energy in indivisible quanta of size
$h\nu$ (Planck constant $h$). One photon ejects one electron only if it
carries more than the metal's work function $\phi$ (the energy needed
to free an electron). The leftover becomes kinetic energy:

$$K_\text{max} = h\nu - \phi,$$

so emission needs $h\nu>\phi$, that is $\nu$ above the threshold
$\nu_0=\phi/h$. Brightening the light sends more photons (more
electrons) but does not change each photon's energy, so it never
speeds the electrons up. Only raising $\nu$ does.

### Reading it off the stopping voltage

Apply a retarding voltage; the current stops when the voltage just
cancels the fastest electrons:

$$e\,V_\text{stop} = K_\text{max} = h\nu - \phi.$$

Plotting $V_\text{stop}$ against $\nu$ gives a straight line whose
slope is the universal constant $h/e$, the same for every metal, and
whose intercept gives that metal's $\nu_0$.

### Things to try

- Pick a high-work-function metal and sweep $\nu$ up through its
  threshold: nothing, then a sudden onset.
- Below threshold, crank the intensity to maximum and confirm the
  current stays exactly zero (the anti-classical result).
- Raise $\nu$ and watch $V_\text{stop}$ climb along the $h/e$ line.

### Where this comes from

Einstein's quantum explanation and the stopping-voltage line follow
Eisberg and Resnick, Quantum Physics of Atoms, 2nd ed., Sections 2.2
to 2.3.

## Physical setup

A phototube: monochromatic light of frequency nu illuminates a metal
cathode of work function phi; ejected electrons cross to an anode held
at an applied voltage V, and an ammeter reads the photocurrent.

## Governing equations

Einstein 1905: a photon carries `E = h nu`; the maximum
photoelectron kinetic energy is

`K_max = h nu - phi`,

emission only if `h nu > phi` (threshold `nu0 = phi/h`). The stopping
voltage is `V_stop = K_max / e`, linear in nu with the universal slope
`h/e`. The saturation photocurrent is proportional to intensity; the
retarding cutoff at `-V_stop` is independent of intensity.

## Numerical method

Closed-form Einstein relation in eV and PHz; the I-V curve is the
saturating response with a hard zero below the cutoff; the Einstein
line and its least-squares slope/intercept are computed analytically.
Reference: Eisberg and Resnick, *Quantum Physics of Atoms* (2nd ed.),
Sec. 2.2-2.3.

## Controls

- metal: cesium, sodium, zinc, copper, platinum (different phi).
- frequency nu (PHz): sweeps below and above threshold.
- light intensity: scales the photocurrent, not K_max.
- applied voltage V: accelerating or retarding.
- Reset, Pause.

## Expected qualitative features

- Below threshold (low nu or high-phi metal): no electrons, brightening
  the light changes nothing.
- Above threshold: a dense electron field; raising nu speeds them and
  raises V_stop; raising intensity adds electrons at the same speed.
- Retarding V shrinks the electron reach; past -V_stop the current is
  zero. The I-V curve cuts off at -V_stop; the Einstein line is
  straight with slope h/e.

## Invariants and acceptance thresholds

- `K_max = h nu - phi` above threshold; `K_max <= 0` (no emission)
  below; `K_max = 0` at `nu0`.
- No photocurrent below threshold at any intensity or voltage.
- `K_max` independent of intensity; the I-V cutoff sits at `-V_stop`
  for every intensity.
- Einstein line slope `= h/e` within 1e-6, metal-independent;
  x-intercept `= nu0` within 0.1%.
- Saturation current proportional to intensity (2x, 4x exact).
- Higher nu raises `V_stop`; larger phi raises `nu0`.

## Limiting cases for verification

- `nu -> nu0+`: `K_max -> 0`, `V_stop -> 0`.
- `nu < nu0`: zero current independent of intensity (the
  anti-classical result).

Source: Eisberg and Resnick, *Quantum Physics of Atoms* (2nd ed.),
Sec. 2.2-2.3.
