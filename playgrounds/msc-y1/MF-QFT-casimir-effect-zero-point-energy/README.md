# Casimir Effect: Zero-Point Modes and the d^-4 Pressure

This playground shows why two uncharged metal plates in a vacuum pull
on each other. The top panel draws the plates with the standing
electromagnetic modes that fit between them (cyan) and the
long-wavelength modes that the gap excludes (red), plus the inward
vacuum pressure. The lower-left panel is the famous d^-4 pressure law
on log-log axes; the lower-right panel contrasts the pressure with the
zero-point energy.

Watch the squeeze: as the plates close, fewer long-wavelength modes
fit between them while the full continuum keeps pushing from outside,
so the inward pressure arrows grow steeply and the operating point
climbs the d^-4 line. At one micron the pressure is about 1.3
millipascals, tiny but real and measured; halve the gap and it jumps
by a factor of sixteen, because the pressure goes as the inverse
fourth power of the separation. The energy stored between the plates
is negative and falls as the inverse cube, and the force is exactly
minus its derivative.

`plate separation d` sets the gap in nanometres (the pressure scales
as d^-4). `mode cutoff index` controls how many allowed standing
modes are drawn. Reset returns to d = 1000 nm. Pause/Play stops or
replays the closing sweep, and Copy URL shares the exact state. The
log-log law and energy panels read without motion for
`prefers-reduced-motion`.

## Reference

Primary citation: `casimir1948` (the original result); see also
`milonni-vacuum` and `lamoreaux1997` (the first precision
measurement).

## Verification

- Strong invariant: P = 1.3 mPa at 1 micron to 1%; P scales as d^-4
  to 0.1% (log-log slope -4); the force is attractive and equals
  -dE/dd.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
