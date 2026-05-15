---
title: "Pulsar Dispersion Measure Dedispersion"
slug: pulsar-dispersion-measure
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: MAA-OT
supporting_ucs: [MAA-AS]
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, radio-astronomy, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [dm]
---

# Pulsar Dispersion Measure Dedispersion

Dynamic spectrum: frequency vertical (400 to 1600 MHz), time horizontal. The pulse arrives later at lower frequencies, tracing the classic $\propto f^{-2}$ DM sweep. Below, the dedispersed time series shifts each channel by the chosen DM and sums; correct DM gives a sharp narrow spike, wrong DM gives a smeared blob. Presets for Crab, B1937+21, Vela, FRB-like DM = 500.

## Physical setup

Dispersion delay $\Delta t = \mathrm{DM}/(2.41 \times 10^{-4}) (1/f_\mathrm{MHz}^2 - 1/f_\mathrm{ref}^2)$ ms with DM in pc cm$^{-3}$. Dedispersion: shift each frequency channel by $-\Delta t$ before summing. Scattering broadening: convolve channels with exponential tail $\tau_s \propto f^{-4}$.

## Controls

- DM slider (0 to 1000 pc cm$^{-3}$)
- Intrinsic pulse width, center frequency, scattering timescale
- Find-DM button: grid search for the DM maximizing dedispersed peak

## Invariants

- Delay from 400 to 1400 MHz at DM = 100 matches the analytic formula within 0.1%.
- Dedispersed SNR maximum at the true DM; monotone decrease as DM departs by 10%.
- Scattering scales as $f^{-4}$ within 2%.

## Citations

Lorimer & Kramer, "Handbook of Pulsar Astronomy" ch. 4 (`lorimer-kramer`).
