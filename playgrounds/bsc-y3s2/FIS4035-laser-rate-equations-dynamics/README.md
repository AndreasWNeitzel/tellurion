# Laser Rate-Equation Dynamics

This playground integrates the normalised two-level laser rate
equations: an external pump `r` builds a population inversion `n`, the
inversion is depleted by stimulated emission into the cavity photon
number `p`, and photons leak out through a cavity of dimensionless
quality `q0`. Net gain exists only when `n > 1/q0`, so the threshold
pump and threshold inversion are both `1/q0`. The three-panel Canvas2D
view shows the resonator with a live inversion bar and the `n_th` line,
the full turn-on transient `phi(t)` and `n(t)`, and the output power
versus pump with its threshold kink and the marked operating point.

Look for the class-B turn-on in the trace panel: from a dark cavity the
inversion overshoots, dumps one giant photon spike, then both `n` and
`p` ring down through damped relaxation oscillations and settle exactly
onto `n^* = 1/q0` and `p^* = r q0 - 1` (the dashed reference lines).
This gain clamping is the signature of a laser above threshold: push
the pump up and the steady inversion does not move off `1/q0`, only the
output power rises, linearly, with the sharp kink at `r = 1/q0` visible
in the bottom panel. The Q-switched regime instead charges a large
inversion at low cavity Q and dumps it as a single giant pulse.

`regime` selects below threshold, CW above threshold, or Q-switched.
`pump r` and `cavity q0` set the operating point and the threshold
`1/q0`; smaller `q0` or stronger pump changes the relaxation-oscillation
damping. Reset restores the CW default (`r = 12`, `q0 = 0.25`); the CW
and below-threshold runs freeze once settled, and Play replays the
transient. Copy URL shares the exact state. The view is static-friendly
(no motion required to read the physics); `prefers-reduced-motion` is
respected by the freeze-on-settle behaviour.

## Reference

Primary citation: `siegman1986` (Siegman, *Lasers*, University Science
Books 1986, Ch. 13 and Ch. 25); also `saleh2007` (Saleh and Teich,
*Fundamentals of Photonics*, 2nd ed., Wiley 2007, Ch. 16).

## Verification

- Strong invariant: above threshold the inversion clamps at `n_th =
  1/q0` independent of pump (threshold: within 1%); the Q-switch pulse
  obeys the exact rate-equation energy balance to within 1%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
