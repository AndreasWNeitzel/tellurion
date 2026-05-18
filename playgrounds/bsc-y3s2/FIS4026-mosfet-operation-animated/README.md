# MOSFET Operation: Channel, Pinch-off and I-V Regions

This playground runs an n-channel enhancement MOSFET with the
square-law (level-1) model. The top panel is the I_D-V_DS output
characteristics for a family of gate voltages; each curve rises in the
triode region and then flattens in saturation, and the amber dashed
parabola is the pinch-off locus V_DS = V_GS - V_th that separates the
two. The lower-left panel is the device cross-section with the
inversion channel drawn in; the lower-right panel is the I_D-V_GS
transfer curve with the threshold marked. The drain voltage sweeps
automatically so the operating point and the channel shape animate.

Watch the inversion channel in the cross-section as V_DS rises. At
V_DS = 0 it is a uniform slab; as V_DS grows the channel thins toward
the drain, and exactly when V_DS reaches the overdrive V_GS - V_th it
pinches off at the drain and the current stops growing: that is the
onset of saturation, and it lines up with the knee of the output curve
sitting on the pinch-off parabola. Below threshold the channel never
forms and the device is off. The transfer curve is flat until V_th
then rises, square-law when the device is saturated.

`gate V_GS` selects which output curve is highlighted and where the
operating point sits; `threshold V_th` shifts turn-on and the
pinch-off locus; `channel-length mod lambda` tilts the saturation
region so the output is no longer perfectly flat. Reset returns to
V_GS = 3 V, V_th = 1 V, lambda = 0. Pause/Play stops or replays the
V_DS sweep, and Copy URL shares the exact state. The output and
transfer panels are static-readable for `prefers-reduced-motion`.

## Reference

Primary citation: `shichman-hodges1968` (the level-1 square-law
model); see also `neamen2012` Ch. 10-11 and `sze-devices`.

## Verification

- Strong invariant: the triode/saturation boundary is exactly
  V_DS = V_GS - V_th with a C1 square law; saturation current is
  quadratic in the overdrive; subthreshold current is below 1e-6 of
  the on-state.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
