---
title: The Photoelectric Effect
slug: photoelectric-effect-simulator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Crank the light brighter and still nothing happens below the threshold frequency: the experiment that forced energy into quanta.'
one_paragraph: 'The photoelectric effect as a phototube: light of frequency nu strikes a metal cathode and, if h nu exceeds the work function phi, photoelectrons are ejected with K_max = h nu - phi and drift to the anode under the applied voltage. Below the threshold nu0 = phi/h no electrons appear at any intensity, the result classical wave theory could not explain. Raising the intensity adds electrons but never speeds them up; raising the frequency does. The primary scene is the physical phototube; the side panels are the current-voltage curve (cut off at the stopping voltage, saturating with intensity) and the Einstein line V_stop(nu) of universal slope h/e. The headless sim.js is gate-tested for the Einstein equation, the threshold, intensity independence of K_max, the h/e slope, and the saturation/cutoff behaviour.'
tags: [quantum, modern-physics, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
share_state_keys: []
---

# The Photoelectric Effect

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
Sec. 2.2-2.3 (`eisberg-resnick`).

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
Sec. 2.2-2.3 (`eisberg-resnick`).
