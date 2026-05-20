# Neutron Star Legend

A five-mode laboratory for the second-most-extreme object in the
universe. The same NS (mass M, period P, magnetic field B, magnetic-axis
inclination alpha) is shared across all modes, so the user builds a
single mental model from the pulsar to the magnetar to the EOS.

## Modes

- **Overview**: rotating 1.4 M_sun NS + tilted magnetic-dipole field
  lines + two radio-beam cones (Rankin 1993 rho ~ 6 deg sqrt(P/1 s)).
- **Lighthouse**: pulse profile I(phi) over one rotation, computed from
  Gaussian beams + line of sight; a moving cursor tracks the current
  phase, and the pulse fades when alpha + beta exceeds the beam.
- **Magnetar**: B = 10^14 to 10^15 G; X-ray flare events with the
  Hurley 2005 phenomenological lightcurve (sharp rise, exponential
  decay); jets along the magnetic axis flash during a flare.
- **Structure (TOV)**: NS interior cross-section (outer crust, inner
  crust with nuclear pasta, outer core, inner core); mass-radius
  curves for three EOS families (SLy / APR / FPS, Lattimer-Prakash
  2001) with the current (R, M) marker.
- **Spindown + Glitch**: P(t) over 1000 yr from classical magnetic
  dipole spindown, with a vortex-unpinning glitch (Anderson-Itoh 1975)
  at t = 600 yr (Delta Omega / Omega = 10^-6, partial recovery).

## What to look for

- Slide `alpha` to 0 (aligned rotator) and the pulse vanishes (sin^2
  alpha shuts off the spindown too).
- Crank `log B` from 12 to 15 to convert from radio pulsar to magnetar.
- In Structure mode, slide `mass` past the EOS peak to fall onto the
  unstable branch of the M-R curve.
- In Spindown mode, the glitch at t = 600 yr produces a visible
  downward jump in P with partial recovery.

## Source

Shapiro and Teukolsky, *Black Holes, White Dwarfs and Neutron Stars*,
Wiley 1983, Ch. 9 to 10 (`shapiro-teukolsky-bh-wd-ns`); Lattimer and
Prakash, *ApJ* 550 (2001) 426 (`lattimer-prakash-mass-radius`);
Lorimer and Kramer, *Handbook of Pulsar Astronomy*, CUP 2005;
Hurley et al., *Nature* 434 (2005) 1098 (SGR 1806-20 giant flare);
Anderson and Itoh, *Nature* 256 (1975) 25 (glitch model).
