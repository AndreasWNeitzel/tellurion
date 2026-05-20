# Radial-Velocity Exoplanet Detection

A star and a planet orbit their common center of mass. The star's
line-of-sight velocity makes a periodic wobble; the Doppler shift of
its spectral lines reveals the planet's mass × sin(i), the orbital
period, and the eccentricity. 51 Peg b (Mayor and Queloz 1995) was
the first exoplanet found around a Sun-like star this way.

The playground shows the top-down orbit of star (yellow) and planet
(blue), the radial-velocity curve over one period (yellow curve, blue
current marker), and a Doppler-shifted spectral line indicator that
flips between blueshift and redshift as the star wobbles.

Engine: Newton-Raphson Kepler solver, closed-form K = (2 pi G / P)^(1/3)
m_p sin(i) (M+m)^{-2/3} (1-e^2)^{-1/2}.

Reference: Murray and Dermott, Solar System Dynamics, Ch. 2; Mayor and
Queloz, Nature 378 (1995) 355.
