---
title: Solar Cell: I-V, Fill Factor and the Shockley-Queisser Limit
slug: solar-cell-generation-iv
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4026
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: shockley-queisser1961
hook: 'A solar cell trades current for voltage along its I-V curve: short-circuit gives the full photocurrent at zero volts, open-circuit gives V_oc at zero current, and the power peaks in between. The open-circuit voltage can never reach the bandgap voltage, and the detailed-balance Shockley-Queisser limit caps the efficiency near 30% at a gap of about 1.3 eV.'
one_paragraph: 'An interactive single-diode solar cell with the Shockley-Queisser detailed-balance limit (Shockley 1949; Shockley and Queisser 1961; Green 1981; Wurfel 2009). The ideal model I(V) = I_L - I_0[exp(V/(n V_T)) - 1] gives I_sc = I_L at V = 0 and V_oc = n V_T ln(I_L/I_0 + 1) at I = 0; the power P = V I peaks at the maximum-power point, with fill factor FF = V_mp I_mp/(V_oc I_sc) and efficiency eta = P_mpp/P_in. Panel A draws the I-V and P-V curves with I_sc, V_oc, the maximum-power point and the fill-factor rectangle for a realistic cell (a typical sub-gap voltage deficit from non-radiative recombination, so the knee is visible); a load point sweeps from short circuit to open circuit. Panel B rains photons above the gap onto the cell, generating electron-hole pairs and the photocurrent. Panel C is the radiative detailed-balance Shockley-Queisser efficiency versus bandgap (a blackbody sun diluted to the chosen incident power, recombination from the cell 300 K blackbody), peaking near 30% at about 1.3 eV, with the realistic cell efficiency shown below the limit. The numerics are the gate-tested sim.js: closed-form / quadrature, deterministic, no RNG; the invariants check V = 0 gives I_sc, I = 0 gives the V_oc formula, V_oc < E_g/q, a single P-V maximum with 0 < FF < 1 matching the Green expression, the Shockley-Queisser curve a single peak near 1.1 to 1.4 eV around 30%, and the linear/logarithmic illumination scaling.'
tags: [photovoltaics, semiconductors, detailed-balance, solar-cell, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [eg, suns, pin]
---

# Solar Cell: I-V, Fill Factor and the Shockley-Queisser Limit

## Physical setup

A p-n junction solar cell under illumination: photons with energy
above the bandgap create electron-hole pairs, driving a photocurrent
`I_L`. The cell behaves as a current source in parallel with a diode;
the external load sets the operating voltage. Short circuit (`V = 0`)
gives the full photocurrent; open circuit (`I = 0`) gives the maximum
voltage `V_oc`; the delivered power peaks between them. The
thermodynamic ceiling on efficiency is the detailed-balance limit.

## Governing equations

Ideal single-diode model (Shockley 1949):

```math
I(V) = I_L - I_0\left[\exp\!\frac{V}{n V_T} - 1\right],
\qquad V_T = \frac{kT}{q},
```

so `I_sc = I(0) = I_L` and `V_oc = n V_T \ln(I_L/I_0 + 1)`. The fill
factor is `FF = V_{mp} I_{mp}/(V_{oc} I_{sc})` (Green 1981 empirical
form `FF = (v_oc - ln(v_oc + 0.72))/(v_oc + 1)`, `v_oc = V_oc/(nV_T)`)
and the efficiency `eta = P_{mpp}/P_{in}`. The Shockley-Queisser limit
(Shockley and Queisser 1961) takes the photocurrent from every photon
above the gap of a blackbody sun and the recombination from the cell's
own blackbody emission, giving `V_oc < E_g/q` and a single efficiency
maximum near 1.1 to 1.4 eV.

## Numerical method

The cell currents, maximum-power point (golden-section search), fill
factor and the detailed-balance integrals (Simpson quadrature of the
Planck photon flux) are all closed form. Panel A uses a realistic
saturation current (a typical 0.45 V sub-gap deficit) so the knee and
the maximum-power point are visible; panel C uses the true radiative
detailed-balance. A load point sweeps `V` from 0 to `V_oc`; the
capture path maps capture fraction directly to `V = f V_oc`, so
reference frames are reproducible and frame-rate independent.
Deterministic, no RNG.

## Controls

- `spectrum` (share key `pin`): AM1.5G (1000 W/m^2) or AM0
  (1353 W/m^2) incident power.
- `bandgap E_g` (share key `eg`): the absorber bandgap; moves the
  operating point on the Shockley-Queisser curve.
- `concentration` (share key `suns`): solar concentration; raises
  `I_sc` linearly and `V_oc` logarithmically.
- Reset (`E_g = 1.34 eV`, 1 sun, AM1.5G), Pause/Play (Play replays the
  load sweep), Copy URL.

## Expected qualitative features

- At `V = 0`, `I = I_sc`; at `I = 0`, `V = V_oc`; power zero at both
  ends with a single interior maximum.
- The fill-factor rectangle (`V_mp x I_mp`) sits inside the
  `V_oc x I_sc` box.
- `V_oc < E_g/q` always (it cannot reach the bandgap voltage).
- The Shockley-Queisser curve rises, peaks near 1.1 to 1.4 eV around
  30%, and falls; the realistic cell efficiency sits below the limit.
- More suns: `I_sc` scales linearly, `V_oc` rises by `n V_T ln(C)`.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. `V = 0` gives `I = I_sc = I_L`.
2. `I = 0` gives `V = V_oc = n V_T ln(I_L/I_0 + 1)` (current vanishes
   to `< 1e-9 I_sc`).
3. `V_oc < E_g/q` for the detailed-balance cell across the gap range.
4. The P-V curve has a single interior maximum, `0 < FF < 1`, and
   `FF` within ~1% of the Green expression.
5. The Shockley-Queisser efficiency has a single peak in `[1.0, 1.5]`
   eV with value in `[0.27, 0.40]`, collapsing at both gap extremes.
6. Stronger illumination raises `I_sc` linearly and `V_oc` by
   `n V_T ln(C)`.
7. Determinism: identical inputs reproduce the curves bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `I_0 -> 0` (radiative limit): `V_oc -> E_g/q` from below, never
  reaching it (test 3).
- `V = 0` / `I = 0`: the short-circuit and open-circuit endpoints
  (tests 1, 2).
- `E_g -> 0` or large: Shockley-Queisser efficiency `-> 0` (test 5).
- Concentration `C`: `I_sc ~ C`, `V_oc ~ ln C` (test 6).

## Visual fallback

Static three-panel Canvas2D: the I-V/P-V curves and the
Shockley-Queisser curve are fully informative without animation; only
the load operating point and the photon rain animate.

## Citations

- Shockley, W. and Queisser, H. J., J. Appl. Phys. 32, 510 (1961).
  `shockley-queisser1961`.
- Shockley, W., Bell Syst. Tech. J. 28, 435 (1949). `shockley1949`.
- Green, M. A., Solid-State Electron. 24, 788 (1981). `green1981`.
- Wurfel, P., *Physics of Solar Cells*, 2nd ed., Wiley-VCH 2009.
  `wurfel2009`.

## Stretch goals

- Series and shunt resistance (the realistic five-parameter model).
- Tabulated AM1.5G spectrum instead of the blackbody sun.
- Tandem / multi-junction detailed-balance limits.

## Risk register

- Blackbody sun versus the tabulated AM1.5 spectrum: the
  detailed-balance peak is ~30% (blackbody) vs ~33.7% (AM1.5); the
  blackbody construction is the original Shockley-Queisser method and
  is what the test pins.
- Panel A uses a realistic (non-radiative) saturation current for a
  visible knee while panel C is the radiative limit: this is stated;
  the invariants test the single-diode identities with explicit
  parameters, independent of the display choice.
- Quadrature truncation of the Planck integral: the energy window
  extends well past the thermal cutoff so the tail is negligible.
