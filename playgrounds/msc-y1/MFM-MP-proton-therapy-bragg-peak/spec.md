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
one_paragraph: 'A proton-radiotherapy depth-dose playground (Wilson 1946; Bortfeld 1997). The Bragg-Kleeman rule R = alpha E0^p with p = 1.77 gives the proton range; the pristine depth dose is the (R - z)^{1/p - 1} stopping-power profile convolved with Gaussian range straggling, producing a low entrance dose, a sharp Bragg peak just before the end of range, and essentially no dose beyond. A spread-out Bragg peak is built as a weighted superposition of pristine peaks of decreasing energy, with the weights fitted to flatten the dose over a target plateau. The photon depth dose (build-up then near-exponential attenuation) is shown for contrast. Panel A is the depth dose against the X-ray curve; Panel B is the SOBP as a sum of weighted pristine peaks; Panel C is the dose along a patient with the tumour marked. The range-energy law, the sharp Bragg peak just before the end of range with essentially no dose beyond, and the flat spread-out Bragg peak built from weighted pristine peaks are the physical content. Reference: Bortfeld 1997; Podgorsak, Radiation Physics for Medical Physicists, Chapter 14.'
tags: [medical-physics, proton-therapy, bragg-peak, dosimetry, live-readout]
difficulty: 4
tier: standard
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [e, mode, pw]
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
  - "Bortfeld, An analytical approximation of the Bragg curve for therapeutic proton beams."
---

# Proton Therapy: the Bragg Peak and the Spread-Out Bragg Peak

## Explainer

### What you are looking at

The reason proton therapy can hit a deep tumor while sparing the
tissue in front of and behind it comes down to one curve: a proton
dumps almost all its energy in a sharp spike right at the end of its
range, the Bragg peak. The playground shows that peak, how its depth
tracks the beam energy, and how stacking energies builds a flat dose
over a tumor.

### Why charged particles peak: the Bethe stopping power

As a proton slows in tissue it loses energy primarily by ionising
atoms; the rate of energy loss per unit path length, in magnitude, is
the Bethe stopping power:

$$\boxed{\;-\,\frac{dE}{dx}
       = \frac{4\pi\,n_e\,z^2\,e^4}{m_e\,v^2}\,
       \left[\ln\!\frac{2\,m_e\,v^2}{I} - \ln(1 - \beta^2) - \beta^2\right].\;}$$

For non-relativistic protons in water this reduces to

$$-\frac{dE}{dx} \;\propto\; \frac{z^2}{v^2}\,\ln\!\frac{2\,m_e\,v^2}{I},$$

with the crucial $1/v^2$ factor: as the proton slows, it loses energy
ever faster. The deposition is small at the entrance (fast proton)
and rises sharply just before it stops (slow proton). That is the
Bragg peak.

Integrating the stopping power gives the empirical Bragg-Kleeman
range-energy relation:

$$\boxed{\;R(E_0) \;\approx\; \alpha\,E_0^{\,p},\qquad
   \alpha \approx 0.0022\,\mathrm{cm\,MeV^{-p}}, \quad
   p \approx 1.77\ \text{(water)}.\;}$$

A 200 MeV proton has $R \approx 26\,\mathrm{cm}$; a 70 MeV proton has
$R \approx 4\,\mathrm{cm}$. So the depth of the peak is controllably
set by the beam energy alone, which is what makes proton therapy
viable.

### Symbols, at a glance

- $E$, kinetic energy of the proton (MeV); $E_0$ the entrance
  energy.
- $x$, path length in tissue (cm); $R(E_0)$ the range.
- $v$, proton speed; $\beta = v/c$.
- $z$, charge of the projectile ($z = 1$ for a proton).
- $m_e$, electron mass; $n_e$, electron number density of the medium
  (about $3.3 \times 10^{29}\,\mathrm{m^{-3}}$ for water).
- $I$, mean ionisation potential ($I \approx 75\,\mathrm{eV}$ for
  water).
- $\alpha$, $p$, the Bragg-Kleeman fit constants.

### The spread-out Bragg peak (SOBP)

A single pristine peak is too narrow ($\sim 1\,\mathrm{cm}$ FWHM) to
cover a tumour, so a clinical plan superposes peaks of decreasing
energy and weight $w_i$:

$$D_{\rm SOBP}(x) = \sum_i w_i\,D_{\rm peak}(x; E_i),$$

with the weights chosen so the plateau is flat and the distal edge
remains sharp. Typical clinical SOBPs cover 4-15 cm in depth with
about 30 individual peaks. Contrast a megavoltage photon beam, whose
dose follows an attenuation $D_\gamma(x) \propto e^{-\mu x}$ after a
short build-up, depositing energy in everything beyond the tumour
exponentially with the absorption coefficient $\mu$. The proton
"distal edge" sparing is the entire clinical case.

### Things to try

- Sweep the proton energy and watch the Bragg peak move deeper as
  $R\propto E^{1.77}$, with little entrance dose.
- Build the spread-out Bragg peak by stacking energies and watch a
  flat plateau form with a sharp distal edge.
- Toggle the photon depth-dose and see it keep depositing beyond the
  target (no distal sparing): the clinical contrast.

### Bibliographic origin

The Bethe stopping power (the original quantum-mechanical derivation):
Bethe, *Annalen der Physik* **397** (1930) 325. The Bragg peak itself
was observed by William Henry Bragg, *Phil. Mag.* **8** (1904) 719.
The Bragg-Kleeman range fit: Bragg and Kleeman, *Phil. Mag.* **10**
(1905) 318. The medical case for protons was made in Wilson, *Radiology*
**47** (1946) 487 (the same Robert R. Wilson who later directed
Fermilab). Modern textbooks: Podgorsak, *Radiation Physics for Medical
Physicists* (3rd ed., Springer 2016), Ch. 6, 7; Paganetti, *Proton
Therapy Physics* (2nd ed., CRC 2018), Ch. 2, 6.

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
