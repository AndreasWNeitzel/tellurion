# DEVNOTES - msc-y1/MAA-OT-pulsar-dispersion-measure (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Rework 2026-05-19 (user: incomplete, never visualizes the pulsar object)
- Added the pulsar OBJECT: a spinning neutron star with dipole-field
  hint and two beams swept like a lighthouse (period control); the
  beam crossing the line of sight flashes and a wavefront races to
  the dynamic spectrum.
- Physics extracted to sim.js (delayMs / dynamicSpectrum /
  dedisperse / snr). REAL BUG fixed: dedisperse used
  shift = -delay/dt; de-dispersion must ADD +delay(guess) to
  realign, so a wrong DM was concentrating better than the true one
  (present in the original too, masked by a broken window).
- Time window now scales with the actual sweep
  (Twin ~ 1.45 * delay(DM, fLo, fHi)); the fixed 220 ms window only
  ever caught a sliver. Channel kernel floored at ~0.9*dt (finite
  channel time resolution) so the discrete sum can concentrate.
- invariants.test.mjs was a placeholder skeleton; replaced with 6
  real ones (delay formula vs analytic; zero at f_ref; linear in DM;
  f^-2 law; S/N maximal at the true DM; correct DM gives a taller
  peak; zero DM = no sweep).
- index.html description filled (was "Playground."); on-canvas
  readout (DOM panel hidden, was overlap-prone); shared cividis;
  Find-DM grid search; presets. Capture sweeps trial DM 40 -> 120
  (WRONG -> MATCH), 5 byte-distinct goldens.
Gate: 6 invariants + smoke + visual 5/5 x3 PASS.
