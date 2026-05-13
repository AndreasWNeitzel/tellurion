# Schwarzschild effective potential and the ISCO

The effective radial potential for geodesics outside a Schwarzschild
black hole. For massive particles V_eff = (1/2)(1 - 2M/r)(1 + L^2/r^2) -
1/2; for photons V_eff = (1/2)(L^2/r^2)(1 - 2M/r). Circular orbits sit
at extrema of V_eff. The photon sphere r = 3M is an unstable circular
photon orbit; the ISCO at r = 6M is the smallest stable circular orbit
for massive matter.

Look for: in massive mode at L = 4.5, V_eff has a local maximum (the
unstable inner turning point, yellow dot) and a local minimum (the
stable outer turning point). As L decreases toward 2 sqrt(3) M ~ 3.46,
the two points merge at r = 6M (the ISCO). Below that, the potential
becomes monotonic and matter is gravitationally captured. Switch to
photon mode to see the single peak at r = 3M.

Use L/M and mode sliders to explore. Speed auto-sweeps L. Reset
restores L = 4.5.

## Reference

- Carroll, Spacetime and Geometry Ch. 5.
- Hartle, Gravity Ch. 9 (`schutz-firstcourse`).

## Verification

- Strong invariant: photon peak at 3M with value L^2/54; ISCO at 6M;
  V_eff(2M) = -1/2.
- Visual gate: SSIM > 0.92 across 5 frames sweeping L.
- Last verified: see `.verified`.
