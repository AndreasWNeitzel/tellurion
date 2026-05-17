---
title: Plasma-Wave Dispersion
slug: plasma-waves-dispersion
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: stix1992
hook: 'The omega-k map of a plasma: the O-mode cutoff at omega_p, the X-mode stop-band between the upper-hybrid resonance and the right cutoff, the Bohm-Gross, ion-acoustic and Alfven branches, all closed form and gate-tested.'
one_paragraph: 'An interactive omega-k dispersion diagram of the basic plasma waves. The electron plasma frequency omega_p = sqrt(n e^2 / eps0 m_e) sets the scale. The ordinary (O) mode omega^2 = omega_p^2 + c^2 k^2 has a cutoff at omega = omega_p and a superluminal phase speed with v_ph v_gr = c^2; the extraordinary (X) mode has the right/left cutoffs and the upper-hybrid resonance omega_UH = sqrt(omega_p^2 + omega_c^2), with a stop-band between the resonance and the right cutoff; the Bohm-Gross Langmuir branch is omega^2 = omega_p^2 + 3 k^2 v_th^2; the ion-acoustic branch saturates at c_s/lambda_D; the Alfven wave omega = k v_A is non-dispersive. A marker sweeps the branch reporting the phase and group speed, with an inset wave at the marked (k, omega) travelling at the phase speed. Every relation is closed form (gate-tested sim.js); the run is deterministic.'
tags: [plasma, dispersion, cutoffs, resonances, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [wave_mode, wp_rel, wc_rel]
---

# Plasma-Wave Dispersion

## Physical setup

A uniform plasma supports a family of waves whose frequency depends
on wavenumber, the dispersion relation. The electron plasma
frequency `omega_p` and the electron cyclotron frequency `omega_c`
set the scales. Electromagnetic waves split into the ordinary (O)
and extraordinary (X) modes; electrostatic oscillations are the
Langmuir (electron) and ion-acoustic branches; the low-frequency
magnetised branch is the Alfven wave. Each branch has characteristic
cutoffs (where `k -> 0`, no propagation below) and resonances (where
`k -> infinity`).

## Governing equations

```math
\omega_p = \sqrt{\frac{n e^2}{\varepsilon_0 m_e}}, \qquad
\text{O-mode: } \omega^2 = \omega_p^2 + c^2 k^2, \qquad
\text{Langmuir: } \omega^2 = \omega_p^2 + 3 k^2 v_{th}^2 .
```

```math
\text{X-mode: } \frac{c^2 k^2}{\omega^2}
  = 1 - \frac{\omega_p^2\,(\omega^2 - \omega_p^2)}{\omega^2\,(\omega^2 - \omega_{UH}^2)},
  \quad \omega_{UH}^2 = \omega_p^2 + \omega_c^2 .
```

Ion-acoustic `omega = k c_s / sqrt(1 + k^2 lambda_D^2)`; Alfven
`omega = k v_A`. X-mode cutoffs
`omega_{R,L} = (\pm omega_c + sqrt(omega_c^2 + 4 omega_p^2))/2`; the
upper-hybrid resonance is `omega_UH`. The O-mode satisfies
`v_ph v_gr = c^2` exactly. (Stix 1992; Swanson 2003; Chen 1984, ch. 4.)

## Numerical method

No simulation: every dispersion relation is evaluated in closed form
in `sim.js`, so the cutoffs, resonances, limiting forms and the
`v_ph v_gr = c^2` identity hold to round-off and the run is bitwise
deterministic. The Canvas2D playground draws the selected branch on a
log-log `omega`-`k` plot with the light line `omega = c k`, the
`omega = omega_p` reference, and (X-mode) the cutoff and upper-hybrid
lines; a marker sweeps the branch reporting the phase and group
speed, and a small inset shows a wave at the marked point travelling
at the phase speed. No engine reuse is required (closed-form algebra).

## Controls

- mode: O-mode / X-mode / Langmuir / ion-acoustic / Alfven, default
  O-mode.
- omega_p (relative): slider `0.4` to `2.0`, default `1.0` (scales
  the plasma frequency / sets the cutoff).
- omega_c (relative): slider `0.1` to `2.0`, default `0.6` (sets the
  X-mode cutoffs and the upper-hybrid resonance).
- reset, pause: buttons (pause freezes the sweep).
- Live monospace readouts: `omega_p`, the mode's cutoffs, and the
  phase and group speed at the marker.
- Share-state keys: `wave_mode`, `wp_rel`, `wc_rel`.

## Expected qualitative features

- O-mode: flat at `omega = omega_p` for small `k` (the cutoff), then
  bending up to asymptote the light line from above (superluminal
  phase speed); `v_ph v_gr = c^2`.
- X-mode: propagating below the upper-hybrid resonance and above the
  right cutoff, with an evanescent stop-band between the resonance
  and the right cutoff (and below the left cutoff).
- Langmuir: starts at `omega_p` at `k = 0` and rises as the
  Bohm-Gross parabola.
- ion-acoustic: linear `omega = k c_s` at long wavelength,
  saturating at `c_s / lambda_D`.
- Alfven: a straight line `omega = k v_A` (non-dispersive).
- Increasing `omega_p` raises the O-mode / Langmuir cutoff; changing
  `omega_c` moves the X-mode cutoffs and the resonance.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- plasma-frequency formula (strong): `omega_p` equals
  `sqrt(n e^2 / eps0 m_e)`; zero at `n = 0`; doubles when `n`
  quadruples.
- O-mode cutoff and identity (strong): `omega = omega_p` at `k = 0`;
  `omega^2 - c^2 k^2 = omega_p^2` exactly; phase speed superluminal.
- O-mode speeds (strong): `v_ph v_gr = c^2` to `< 1e-6`,
  `v_gr < c`.
- X-mode band structure (strong): propagating in `(omega_L,
  omega_UH)` and above `omega_R`; evanescent stop-band in
  `(omega_UH, omega_R)` and below `omega_L`.
- Bohm-Gross (strong): `omega -> omega_p` as `k -> 0`;
  `omega^2 - omega_p^2 = 3 k^2 v_th^2` exactly.
- ion-acoustic limits (medium): linear at small `k lambda_D`,
  saturates at `c_s / lambda_D`.
- Alfven (medium): `omega = k v_A` exactly (non-dispersive).
- determinism (medium): pure functions reproduce outputs exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic O-mode sweep, SSIM at least `0.92` vs committed
golden frames. Deterministic (no RNG; closed form).

## Limiting cases for verification

- `k -> 0`, O-mode / Langmuir: `omega -> omega_p` (the cutoff).
- `k -> infinity`, O-mode: `omega -> c k` (the light line).
- X-mode at `omega = omega_UH`: resonance (`k -> infinity`).
- `omega_c -> 0`: the X-mode reduces toward the O-mode.

## Visual fallback

Pure Canvas2D over closed-form algebra: no WebGL, no solver, no RNG,
so the headless capture and SSIM gate are robust. The invariants run
GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Stix, Waves in Plasmas, AIP 1992 (`stix1992`), the cold-plasma
  O/X modes, cutoffs and resonances.
- Swanson, Plasma Waves, 2nd ed., IOP 2003 (`swanson2003`), the
  Appleton-Hartree and Bohm-Gross relations.
- Chen, Introduction to Plasma Physics and Controlled Fusion, 2nd
  ed., ch. 4 (`chen1984`), the wave branches.

## Stretch goals

- A pulse-decomposition mode: build a wave packet and watch it
  disperse according to the selected branch.
- The full CMA diagram (parameter space of propagating regions).
- Whistler and lower-hybrid branches.

## Risk register

- Wrong band structure: the X-mode stop-band lies between the
  upper-hybrid resonance and the right cutoff (and below the left
  cutoff); asserted explicitly by the invariant after an initial
  test-side mistake was caught.
- Over-claiming a simulation: avoided; the model is exact algebra and
  the spec says so; the invariants are physical identities.
- Engagement: a static plot would be flat; mitigated by the sweeping
  marker, the phase/group readouts, and the travelling-wave inset.

## Implementation notes

`sim.js` is self-contained closed-form physics (`plasmaFrequency`,
`langmuir`, `ionAcoustic`, `oMode`, `oModeSpeeds`, `alfven`,
`upperHybrid`, `xCutoffs`, `xModeK2`, `xModePropagates`, `sample`);
`invariants.test.mjs` imports it directly. `playground.js` is pure
Canvas2D: a log-log `omega`-`k` plot with the light line, the cutoffs
and resonance, a sweeping marker, a travelling-wave inset, a throttled
readout, and the `?deterministic=1&capture=NAME&captureFraction=F`
capture contract.
