# Beats from superposition

Two waves of nearly equal frequency add to a fast carrier riding inside a
slow group envelope. The top panel shows this in space: the same two
frequencies travel through a dispersive medium (deep-water ripples,
omega = sqrt(g k)), and the superposition becomes a moving wave group.
Balls sit on the carrier crests and stream forward at the phase velocity
v_p = omega_bar / k_bar, while the group envelope creeps along at the group
velocity v_g = dω/dk. For deep water v_g = v_p / 2 exactly, so the crests
appear at the rear of the group, sweep through it, and vanish at the front.

Listen at one fixed point instead and the same two tones give the temporal
beat: cos(2 pi f_1 t) + cos(2 pi f_2 t) equals 2 cos(2 pi f_bar t)
cos(2 pi f_b t), waxing and waning at the audible beat rate |f_1 - f_2|
(twice the envelope rate). The middle panel is that signal at a point; the
lower panels show the two-line spectrum and the envelope period. With
f_1 = 5.0 and f_2 = 4.7 the beat rate is 0.3 Hz, a 3.33 s period.

Use the f_1 and f_2 sliders to set the two frequencies; their difference
sets both the beat and the spacing between phase and group velocity. Speed
controls how fast the group travels and the time cursor sweeps. Reset
returns to t = 0.

## Reference

- Crawford, Waves and Oscillations, Berkeley Physics Vol. 3 Ch. 1
  (`crawford-waves`)

## Verification

- Strong invariant: product-to-sum identity to 1e-12 across 100 sample
  points; envelope zero crossings at exact analytic positions.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
