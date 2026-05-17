# Two-stream instability (1D PIC plasma)

Two counter-streaming beams of electrons in a plasma. Any tiny density
perturbation grows exponentially; the beams roll into phase-space
vortices ("electron holes") and eventually thermalize. The canonical
kinetic plasma instability, simulated with a 10000-particle 1D-1V PIC.

What to look for: the (x, v) phase panel is drawn with persistence, so
the two beams start as lines and the electron-hole vortices leave
trails as they wind up. The middle strip is the density-mode
spectrogram (`|rho_hat[k]|` for k = 1..8 versus time): mode 1
dominates the linear phase, harmonics light up at saturation. The
bottom trace is `log |rho_hat[k=1]|` with a dashed reference of slope
`gamma = omega_p/(2 sqrt 2)` (Krall and Trivelpiece): in the linear
regime the live `gamma_meas` readout sits within a few percent of it
(default `v_0 = 0.6` puts the fundamental near the peak-growth
wavenumber), then the slope falls toward zero as the mode saturates.

Controls: v_0 (beam speed), speed, reset, pause / play.

## Reference

Hockney and Eastwood, *Computer Simulation Using Particles*, chs. 5-8
(`hockneyeastwood1988`); the analytic growth rate is Krall and
Trivelpiece, *Principles of Plasma Physics* (1973).

## Verification

- Strong invariants: the closed-form max growth is exactly
  `omega_p/(2 sqrt 2)`, the dispersion peaks at `k^2 v0^2 = 3 wp^2/8`,
  unstable for `k v0 < wp`; the PIC mode-1 grows > 5x in `[2, 5]` and
  its linear-regime rate is within a factor ~2 of analytic; momentum
  conserved; particles in domain.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
