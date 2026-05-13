# FitzHugh-Nagumo excitable neuron

A two-variable reduction of the Hodgkin-Huxley model: a fast voltage v
and a slow recovery w, with a cubic nullcline for v and a linear
nullcline for w. With external input I = 0 the system has a stable rest
state; small perturbations decay, but a suprathreshold kick produces
one full action potential before returning. With I above the Hopf
threshold (around 0.4), the system fires periodically.

Look for: at I = 0, the kick button forces a single spike; the v(t)
trace shows the characteristic action-potential shape. Slide I above
0.4 and watch the system transition into limit-cycle firing. The phase
portrait on the right shows the trajectory crossing back and forth
across the nullclines.

Use the I slider for input; kick button forces a perturbation; speed
sets integrator rate.

## Reference

- FitzHugh 1961 Biophys J (`fitzhugh-nagumo1961`).

## Verification

- Strong invariant: rest is fixed point; subthreshold bounded;
  suprathreshold spike; periodic firing at I = 0.5.
- Visual gate: SSIM > 0.92 across 5 frames sweeping I.
- Last verified: see `.verified`.
