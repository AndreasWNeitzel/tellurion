# Rotational splitting of multiplets

A non-rotating star has degenerate $(2\ell+1)$ oscillation modes: the azimuthal
orders $m$ all share one frequency and the surface pattern is a standing wave.
Rotation lifts the degeneracy because the Coriolis force makes prograde and
retrograde azimuthal waves inequivalent. The playground renders the real
spherical-harmonic pattern $Y_\ell^m$ on the star and lets it drift in azimuth:
the drift carries the pattern around so a fixed observer sees it oscillate at
$\nu_0 + m(1 - C_{n\ell})\Omega$, which is exactly the rotational splitting. The
$m=0$ zonal pattern does not drift and stays at $\nu_0$; prograde ($m>0$) and
retrograde ($m<0$) patterns drift in opposite senses and split to opposite
sides of the multiplet shown on the right.

The Ledoux constant $C$ is zero for p-modes and $1/\ell(\ell+1)$ for g-modes in
slow rigid rotation; switching to a g-mode visibly slows the drift and shrinks
the splitting relative to the dashed rigid $m\Omega$ comb. Controls: rotation
rate $\Omega$, degree $\ell$, azimuthal order $m$, and the p/g mode selector.
Measuring this splitting in Kepler light curves is how the internal rotation of
red giants and subgiants was determined.

## Reference

- Aerts, Christensen-Dalsgaard and Kurtz, *Asteroseismology* (2010), Sec. 3.8;
  Ledoux 1951 (`aerts-asteroseism`).

## Verification

- The selected component sits at $\nu_0 + m(1-C)\Omega$ to machine precision,
  and the Ledoux constant matches the mode type (0 for p, $1/\ell(\ell+1)$ for
  g). At $\Omega=0$ the multiplet collapses to a single degenerate peak. See
  `invariants.test.mjs`.
