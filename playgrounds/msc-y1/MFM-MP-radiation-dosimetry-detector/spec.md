---
title: "Ionization-Chamber Dosimetry: Charge, W and Bragg-Gray"
slug: radiation-dosimetry-detector
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MFM-MP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: icru90
hook: 'Photons Compton-scatter in an air cavity; the recoil electrons make ion pairs at one pair per W = 33.97 eV; the pairs drift to the electrodes, where recombination at low voltage reduces the collected charge (the Boag saturation curve); the dose follows from D = (Q/m)(W/e) and the Bragg-Gray stopping-power ratio.'
one_paragraph: 'An ionization-chamber dosimetry playground (ICRU Report 90; Boag 1950; Attix 1986). Photons Compton-scatter in the cavity gas (Klein-Nishina recoil sampling); the recoil electrons ionize the gas at one ion pair per W = 33.97 eV; the pairs drift to the electrodes, where the Boag collection efficiency f = 1/(1 + xi^2/6) (xi proportional to d^2 sqrt(dose rate)/V) reduces the collected charge by recombination at low voltage and saturates to one at high voltage. The cavity dose is D = (Q/m)(W/e) and the medium dose follows from the Bragg-Gray stopping-power ratio. Panel A shows the cavity with recoil electrons and drifting ion pairs (some recombining), Panel B the saturation curve, Panel C the full charge-to-dose chain. The numerics are the gate-tested seeded sim.js: deterministic. Invariants check the ICRU W value, the linearity of the dose in charge and W and its inverse mass dependence, the Bragg-Gray relation, ionization energy conservation, the Boag saturation to full collection, the chamber bookkeeping and determinism.'
tags: [medical-physics, dosimetry, ion-chamber, bragg-gray, live-readout]
difficulty: 3
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [e, v, dr]
---

# Ionization-Chamber Dosimetry: Charge, W and Bragg-Gray

## Physical setup

An ionization chamber: a small gas cavity between two electrodes at a collecting voltage. Photons Compton-scatter in the gas; the recoil electrons strip electrons off gas molecules, creating ion pairs at a fixed average cost of W per pair (33.97 eV in air). The applied field sweeps the ions to the electrodes, where the collected charge is measured. At low voltage some ions recombine before they arrive (the chamber under-reads); at high voltage essentially all are collected (saturation). The charge gives the dose to the gas, and Bragg-Gray cavity theory converts that to the dose in the surrounding medium.

## Governing equations

Cavity dose D_gas = (Q/m)(W/e), with W/e = 33.97 J/C; Bragg-Gray D_med = D_gas (S/rho)_med,gas. Ionization conserves energy: the number of ion pairs is E_deposited / W. The Boag collection efficiency for continuous radiation is f = 1/(1 + xi^2/6), with xi proportional to d^2 sqrt(dose rate)/V, so f -> 1 as the voltage rises and falls with increasing dose rate. The Compton recoil energy comes from Klein-Nishina sampling, T = E - E'.

## Numerical method

A seeded RNG samples the Compton recoil energy by Kahns method; the deposited energy is summed, divided by W to give the ion-pair count and the created charge, multiplied by the Boag efficiency to give the collected charge, and converted to dose. A bounded set of ion pairs is recorded for the drift animation. Deterministic for a given seed.

## Controls

- `e`: photon energy, 30 to 600 keV. Sets the Compton recoil energy and the deposited energy.
- `v`: collecting voltage, 10 to ~3000 V (log slider). Low voltage gives recombination; high voltage gives full collection.
- `dr`: relative dose rate, 1 to 12. A higher dose rate increases recombination at fixed voltage.
- Reset, Pause/Play. Pause freezes the ion-pair drift; the aggregates are static.

## Expected qualitative features

- Recoil electrons and ion pairs drifting in opposite directions to the two electrodes.
- At low voltage many pairs recombine before arrival; at high voltage almost all are collected.
- The Boag saturation curve rising from recombination to f = 1, shifting down with dose rate.
- The charge-to-dose chain: E -> /W -> ion pairs -> charge -> x f -> D_gas -> Bragg-Gray -> D_med.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. W_air = 33.97 eV per ion pair within 1 percent; W/e = 33.97 J/C.
2. D_gas is linear in Q, linear in W and inverse in mass.
3. Bragg-Gray: D_med = D_gas times the stopping-power ratio exactly.
4. Ionization conserves energy: n_pairs W = E_deposited; charge linear in energy.
5. The Boag efficiency saturates to 1 at high voltage, is below 0.7 at 10 V, is monotone in V, and falls with dose rate.
6. Chamber bookkeeping: Q_created = (E/W) e, Q_collected = Q_created f, D = (Q/m)(W/e) s; higher voltage collects more.
7. The Compton recoil energy stays within the kinematic range and reaches both ends.
8. The saturation curve spans recombination to full collection, monotone.
9. Determinism: same seed reproduces; a different seed differs.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- V -> infinity: f -> 1 (full collection), the chamber reads the true dose.
- V -> small: heavy recombination, the chamber under-reads.
- Dose rate up: more recombination at the same voltage (the curve shifts).
- One ion pair per W: n_pairs W = E exactly.

## Visual fallback

The saturation curve and the dose chain are static reads; the ion-pair drift is animation only.

## Citations

- ICRU Report 90 (2014): W_air/e = 33.97 J/C.
- Boag, J. W. and Currant, J., Br. J. Radiol. 23, 601 (1950): ion recombination, the saturation curve.
- Attix, F. H., Introduction to Radiological Physics and Radiation Dosimetry (1986): Bragg-Gray, D = (Q/m)(W/e).

## Stretch goals

- Add the two-voltage extrapolation method for the recombination correction.
- Add a pulsed-beam Boag model and contrast with the continuous case.

## Risk register

- The Boag constant is bundled into one fitted parameter so the saturation curve spans recombination to saturation over a realistic voltage range; the load-bearing checks are the W value, the dose linearity, Bragg-Gray, ionization energy conservation and the saturation limit, not the absolute recombination fraction at a given voltage.
