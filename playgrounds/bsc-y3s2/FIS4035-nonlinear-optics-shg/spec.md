---
title: Second-Harmonic Generation: Phase Matching and Conversion
slug: nonlinear-optics-shg
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4035
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: armstrong-bloembergen1962
hook: 'Frequency doubling only works if the two waves stay in step. With phase mismatch the second-harmonic energy flows back to the fundamental every coherence length and never accumulates; at perfect phase matching it grows as z^2 and, once the pump depletes, saturates as tanh^2 toward 100%. The z^2 growth, the sinc^2 phase-matching acceptance, and the beta-BBO 22.8 degree type-I angle are the physical content.'
one_paragraph: 'An interactive view of second-harmonic generation in a chi(2) crystal under the plane-wave slowly varying envelope approximation (Armstrong, Bloembergen, Ducuing and Pershan 1962; Boyd, Nonlinear Optics, 3rd ed., Academic Press 2008, Ch. 2). In the undepleted-pump limit the second-harmonic intensity is I_2w(z) = (gamma z)^2 sinc^2(dk z/2): at perfect phase matching (dk = 0) it grows exactly as z^2, while for dk != 0 it is a pure sin^2 oscillation of fixed amplitude (2 gamma / dk)^2 with coherence length L_c = pi / |dk|, so the energy cycles between the fundamental and the harmonic every 2 L_c and never accumulates. At perfect phase matching with pump depletion the exact closed form is I_w = sech^2(z/L_NL), I_2w = tanh^2(z/L_NL) with L_NL = 1/gamma, so I_w + I_2w = 1 identically (energy / Manley-Rowe conservation) and the conversion efficiency rises monotonically toward but never reaches 100% (tanh^2 < 1). The phase-matching acceptance is the sinc^2(dk L/2) curve, and the dispersion panel uses the beta-BBO Sellmeier equations (Eimerl, Davis, Velsko, Graham and Zalkin 1987) to show why birefringent angle tuning is needed and to compute the type-I phase-matching angle (about 22.8 degrees for 1064 to 532 nm). Manley-Rowe power conservation (I_w + I_2w = 1) holds identically and the conversion efficiency rises monotonically toward but never reaches unity. Reference: Boyd, Nonlinear Optics, 3rd ed., Chapter 2; Armstrong, Bloembergen, Ducuing and Pershan 1962.'
tags: [nonlinear-optics, photonics, phase-matching, second-harmonic, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [regime, dk, gamma]
---

# Second-Harmonic Generation: Phase Matching and Conversion

## Explainer

### What you are looking at

Shine intense red light into the right crystal and green comes out:
second-harmonic generation, two photons of frequency $\omega$ fused
into one at $2\omega$. Whether you get a strong green beam or almost
nothing hinges on phase matching. The playground shows the conversion
build up (or wash out) along the crystal.

### The coupled waves

A second-order nonlinearity couples the fundamental ($\omega$) and
second-harmonic ($2\omega$) envelopes. In the undepleted-pump limit the
generated $2\omega$ power along a crystal of length $L$ is

$$P_{2\omega} \;\propto\; L^2\,
  \mathrm{sinc}^2\!\left(\frac{\Delta k\,L}{2}\right),
  \qquad \Delta k = k_{2\omega} - 2k_\omega.$$

Everything is controlled by the wavevector mismatch $\Delta k$, which
is nonzero because the crystal's refractive index differs at $\omega$
and $2\omega$ (dispersion).

### Phase matching

If $\Delta k\ne0$ the two waves drift out of phase: the
second-harmonic generated in the first half of the crystal is
destructively cancelled by that from the second half, so the output
oscillates with a tiny coherence length and stays weak. Make
$\Delta k = 0$ (phase matching, achieved with birefringent crystals or
periodic poling) and the contributions add in phase: the power grows as
$L^2$, and with pump depletion the exact solution is

$$P_{2\omega}(L) \propto \tanh^2(\kappa L),$$

so the fundamental can be almost fully converted. The playground shows
both regimes: the $\mathrm{sinc}^2$ ripple at finite mismatch, and the
monotonic $\tanh^2$ rise (with the pump draining) at perfect phase
matching.

### Things to try

- Set a finite $\Delta k$ and watch the green power oscillate with
  depth and stay small (coherence-length-limited).
- Tune to $\Delta k = 0$ and watch it grow as $L^2$, then saturate as
  $\tanh^2$ when the pump depletes.
- Increase the input intensity and see conversion efficiency rise (it
  is a nonlinear, intensity-dependent process).

### Where this comes from

The coupled-wave equations, the $\mathrm{sinc}^2$ mismatch factor, and
the phase-matched $\tanh^2$ conversion follow Armstrong et al. (1962)
and Boyd, *Nonlinear Optics*, Chapter 2.

## Physical setup

A fundamental beam at frequency w propagates through a crystal with a
second-order nonlinearity and generates a second-harmonic beam at 2w.
The two waves accumulate phase at different rates unless their wave
vectors satisfy k_2w = 2 k_w; the residual mismatch
dk = k_2w - 2 k_w controls everything. Two standard regimes are
shown: small conversion (undepleted pump) at arbitrary mismatch, and
the exact phase-matched solution including pump depletion.

## Governing equations

Coupled-wave equations, slowly varying envelopes (Armstrong et al.
1962; Boyd 2008, Ch. 2). Undepleted pump (pump intensity 1):

```math
I_{2w}(z) = (\gamma z)^2\,\mathrm{sinc}^2\!\Big(\frac{\Delta k\,z}{2}\Big),
\qquad \mathrm{sinc}(x) = \frac{\sin x}{x},
```

so `I_2w ~ z^2` at `dk = 0` and otherwise oscillates with coherence
length `L_c = pi / |dk|`, capped at `(2 gamma / dk)^2`. With perfect
phase matching and pump depletion the exact solution is

```math
I_w(z) = \operatorname{sech}^2\!\big(z/L_{NL}\big), \qquad
I_{2w}(z) = \tanh^2\!\big(z/L_{NL}\big), \qquad L_{NL} = 1/\gamma,
```

giving `I_w + I_2w = 1` (Manley-Rowe / energy conservation) and a
conversion efficiency `eta = tanh^2(z/L_NL) < 1` that rises
monotonically toward 1. The dispersion panel uses the beta-BBO
Sellmeier equations (Eimerl et al. 1987) with the type-I angle from
`n_e(theta, lambda/2) = n_o(lambda)`.

## Numerical method

No time integration: `I_2w(z)`, `I_w(z)`, the indices and the
phase-matching angle are evaluated directly from the closed forms.
The beam sweep is the propagation coordinate `z` through a crystal of
length `T = 7 L_NL` (depleted), `min(9 L_c, 60)` (mismatched
undepleted) or a fixed `14` (matched undepleted); the capture path
maps capture fraction directly to `z = f T`, so reference frames are
reproducible and frame-rate independent. Deterministic, no RNG.

## Controls

- `regime` (share key `regime`): undepleted (sinc^2 / coherence
  length) or phase-matched with pump depletion (tanh^2).
- `phase mismatch dk` (share key `dk`): the wave-vector mismatch;
  sets the coherence length and the acceptance operating point.
- `coupling gamma` (share key `gamma`): the nonlinear drive; sets the
  z^2 prefactor and the nonlinear length `L_NL = 1/gamma`.
- Reset (undepleted, `dk = 0.6`, `gamma = 0.06`), Pause/Play (Play
  replays the sweep once it reaches the crystal exit), Copy URL.

## Expected qualitative features

- `dk = 0`, undepleted: monotone `z^2` growth, no oscillation.
- `dk != 0`, undepleted: a constant-amplitude `sin^2` oscillation of
  period `2 L_c` capped at `(2 gamma/dk)^2`; no net conversion.
- Depleted, phase matched: `I_2w` rises as `tanh^2` and `I_w` falls as
  `sech^2`, crossing at `eta = 0.5`, summing to 1 everywhere.
- The acceptance panel is a sinc^2 lobe peaked at `dk = 0`.
- The BBO panel shows `n_o(w)` lying between `n_e(2w)` and `n_o(2w)`,
  so a birefringent phase-matching angle (about 22.8 deg at 1064 nm)
  exists.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Phase-matched undepleted SHG grows exactly as `z^2`
   (`I_2w / z^2` constant to 9 digits); `sinc(0) = 1`.
2. Mismatched undepleted SHG has zeros at `z = 2 m L_c`, is bounded by
   `(2 gamma / dk)^2`, and is below the `dk = 0` curve at large `z`.
3. Depleted phase-matched solution conserves power:
   `I_w + I_2w = 1` to 9 digits (Manley-Rowe).
4. `eta < 1` strictly, monotone non-decreasing, and `> 0.999` by
   `z = 12 L_NL`.
5. Small-z depleted `tanh^2(z/L_NL)` reduces to the undepleted
   `(gamma z)^2` law (agreement as `z -> 0`).
6. beta-BBO Sellmeier matches the literature: `n_o(1.0642) ~ 1.655`,
   `n_o(0.5321) ~ 1.675`, negative uniaxial, sign change of `dk`
   between `theta = 0` and `90 deg`, type-I angle in `[22.0, 23.6]`
   deg with `|dk| < 1e-6` at the solved angle.
7. Determinism: identical inputs reproduce the sweep bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `dk -> 0` undepleted: recovers the `z^2` law (test 1).
- `z -> 0` depleted: recovers the `z^2` law (test 5).
- `z -> infinity` depleted, phase matched: `eta -> 1` (test 4).
- `theta = 0` / `theta = 90 deg`: `n_e(theta)` reduces to
  `n_o(2w)` / `n_e(2w)` (test 6).
- Energy is conserved at every `z` in the depleted solution (test 3).

## Visual fallback

Static three-panel Canvas2D: the full analytic `I_2w(z)` profile is
always drawn (faint), so the z^2 / oscillation / saturation behaviour
reads without animation; the bright sweep and playhead only indicate
the propagation distance. The acceptance and dispersion panels are
time-independent.

## Citations

- Armstrong, J. A., Bloembergen, N., Ducuing, J. and Pershan, P. S.,
  Phys. Rev. 127, 1918 (1962). `armstrong-bloembergen1962`.
- Franken, P. A. et al., Phys. Rev. Lett. 7, 118 (1961).
  `franken-hill1961`.
- Boyd, R. W., *Nonlinear Optics*, 3rd ed., Academic Press 2008,
  Ch. 2. `boyd-nlo2008`.
- Eimerl, D. et al., J. Appl. Phys. 62, 1968 (1987).
  `eimerl-davis1987`.

## Stretch goals

- Full depleted solution at nonzero `dk` (Jacobi elliptic functions,
  Armstrong et al. 1962).
- Gaussian-beam and walk-off corrections to the conversion.
- Temperature-tuned (non-critical) phase matching curves.

## Risk register

- Undepleted formula misused at high conversion: the regime selector
  separates undepleted (small `eta`) from the exact depleted solution;
  the small-z reduction (test 5) checks consistency.
- Sellmeier coefficient set drift: the literature checkpoints (test 6)
  pin `n_o`, `n_e` and the 1064 nm type-I angle against accepted
  beta-BBO values, with tolerances honest to the coefficient spread.
- Coherence-length aliasing of the swept curve at very large `dk`:
  the window is `min(9 L_c, 60)` so a bounded number of periods is
  always well sampled by the 1600-point grid.
