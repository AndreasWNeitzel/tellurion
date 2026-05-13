# Beats from superposition

The sum of two cosines at close frequencies, y(t) = cos(2 pi f_1 t) +
cos(2 pi f_2 t), can be rewritten via the product-to-sum identity as
2 cos(2 pi f_bar t) cos(2 pi f_b t), where f_bar = (f_1 + f_2) / 2 is the
carrier and f_b = |f_1 - f_2| / 2 is the envelope rate. The audible beat
rate (the rate of amplitude maxima) is twice that: |f_1 - f_2|. Everything
here is closed form; no integrator is needed.

Look for: with f_1 = 5.0 and f_2 = 4.7, the audible beat rate is 0.3 Hz,
so the amplitude waxes and wanes with period 1 / 0.3 = 3.33 seconds. Slide
f_2 toward f_1 and the envelope stretches without bound; at f_1 = f_2 the
beats disappear. The spectrum panel below shows two bars at f_1 and f_2;
the envelope is not at those frequencies but at their difference divided
by 2.

Use the f_1 and f_2 sliders to set the two frequencies. Speed controls
how fast the time cursor sweeps across the waveform. Reset returns the
cursor to t = 0.

## Reference

- Crawford, Waves and Oscillations, Berkeley Physics Vol. 3 Ch. 1
  (`crawford-waves`)

## Verification

- Strong invariant: product-to-sum identity to 1e-12 across 100 sample
  points; envelope zero crossings at exact analytic positions.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
