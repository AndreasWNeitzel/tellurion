---
title: "Proton Therapy: the Bragg Peak and the Spread-Out Bragg Peak"
slug: proton-therapy-bragg-peak
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MFM-MP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: bortfeld1997
hook: 'A proton beam deposits little dose entering tissue and almost all of it in a sharp Bragg peak at a depth set by R = alpha E0^1.77, then nothing beyond; superposing pristine peaks of decreasing energy spreads it into a flat plateau over a tumour, while a photon beam irradiates everything past the target.'
one_paragraph: 'A proton-radiotherapy depth-dose playground (Wilson 1946; Bortfeld 1997). The Bragg-Kleeman rule R = alpha E0^p with p = 1.77 gives the proton range; the pristine depth dose is the (R - z)^{1/p - 1} stopping-power profile convolved with Gaussian range straggling, producing a low entrance dose, a sharp Bragg peak just before the end of range, and essentially no dose beyond. A spread-out Bragg peak is built as a weighted superposition of pristine peaks of decreasing energy, with the weights fitted to flatten the dose over a target plateau. The photon depth dose (build-up then near-exponential attenuation) is shown for contrast. Panel A is the depth dose against the X-ray curve; Panel B is the SOBP as a sum of weighted pristine peaks; Panel C is the dose along a patient with the tumour marked. The numerics are the gate-tested closed-form sim.js: deterministic, no RNG. Invariants check the range-energy law, the peak at the end of range with no dose beyond, the photon contrast, the straggling width and the SOBP flatness, superposition and distal edge.'
tags: [medical-physics, proton-therapy, bragg-peak, dosimetry, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [e, mode, pw]
---

# Proton Therapy: the Bragg Peak and the Spread-Out Bragg Peak

## Physical setup

A proton beam slowing down in tissue. Unlike photons, charged particles deposit most of their energy near the end of their range, where the stopping power diverges, producing the Bragg peak. The depth of the peak is set by the beam energy through the Bragg-Kleeman range-energy relation. A clinical treatment spreads the peak over the tumour by stacking pristine peaks of decreasing energy and weight (the spread-out Bragg peak). The contrast with a megavoltage photon beam, which builds up to a shallow maximum and then keeps irradiating, is the physical basis of proton therapy.

## Governing equations

Bragg-Kleeman range: R = alpha E0^p, with alpha = 0.0022 cm and p = 1.77 for protons in water. The pristine depth dose, from the residual-range stopping power, is D0(z) ~ (R - z)^{1/p - 1} for z < R (zero beyond), convolved with a Gaussian of range-straggling width sigma(R) = 0.012 R^0.935 (Bortfeld 1997) plus the beam energy spread. The photon percentage depth dose is (1 - e^{-z/zb}) e^{-mu (z - zmax)}: a build-up to z_max then attenuation, always positive. A SOBP is sum_k w_k D_k(z) with weights fitted to a flat plateau.

## Numerical method

The range and the signal equations are closed form. Each pristine peak is the analytic profile Gaussian-convolved on the depth grid (a fine quadrature resolves the (R - z) cusp). The SOBP weights come from a non-negative coordinate-descent fit to a flat target over the interior plateau, lightly smoothed (clinical weights vary smoothly with depth). Curves are recomputed only on a control change and cached. Deterministic; seed not applicable.

## Controls

- `e`: proton energy, 60 to 230 MeV. Sets the range (and the Bragg-peak depth) through R = alpha E0^1.77.
- `mode`: pristine Bragg peak versus X-ray, or the spread-out Bragg peak.
- `pw`: SOBP plateau width, 10 to 60 percent of the range.
- Reset, Pause/Play. Pause freezes the marker; the curves are static.

## Expected qualitative features

- The proton entrance dose low, a sharp Bragg peak near the end of range, then nothing; the photon curve building up shallow and continuing past.
- Lower energy giving a shallower peak (R ~ E0^1.77).
- The SOBP as a flat plateau over the tumour, built from weighted pristine peaks, with a sharp distal falloff.
- The patient panel: proton dose stopping at the tumour while the photon dose carries through the far side.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. R = alpha E0^1.77 exactly; R(2E)/R(E) = 2^1.77 within 2 percent; monotone; inverse consistent.
2. The Bragg peak is within ~1.5 mm of the distal-90 percent range, proximal to the CSDA range; no dose 1 cm beyond.
3. Proton peak/entrance > 2.5; the photon maximum is shallow and the photon (not the proton) has exit dose far beyond the proton range.
4. The straggling width grows with range; curves normalised.
5. The SOBP (30 peaks, 2 percent spread) is the exact weighted sum of pristine peaks; its plateau ripple is under 10 percent and far flatter than a single peak; the distal falloff is sharp and gone within 3 cm past Rmax.
6. The SOBP distal R90 is within ~2 cm of the deepest pristine range; weights non-negative.
7. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Low energy: a shallow Bragg peak (R ~ E0^1.77).
- z > R: the pristine proton dose is exactly zero (no exit dose).
- A single pristine peak: too narrow to cover a tumour; the SOBP flattens it.
- Photon beam: build-up to z_max then exponential, always positive (exit dose).

## Visual fallback

The depth-dose curves and the patient strip are static reads; there is no required animation.

## Citations

- Wilson, R. R., Radiological Use of Fast Protons, Radiology 47, 487 (1946): the proposal of proton therapy.
- Bortfeld, T., An analytical approximation of the Bragg curve, Med. Phys. 24, 2024 (1997): the range-energy rule, straggling and the SOBP.

## Stretch goals

- Add nuclear-interaction fluence loss and the associated dose tail.
- Add a heterogeneous (bone/lung) medium and the range shift it causes.

## Risk register

- The SOBP plateau retains a few-percent ripple from the simple non-negative weight fit (clinical optimisers do better); the load-bearing checks are the range-energy law, the peak at the end of range with no dose beyond, and that the SOBP is far flatter than a single peak.
