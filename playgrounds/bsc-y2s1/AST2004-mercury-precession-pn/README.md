# Perihelion precession in a Schwarzschild-like potential

A planet on an elliptic orbit around a heavy central body, with a tunable 1PN correction added to Newton. Pure Newton gives closed ellipses; the correction makes the ellipse slowly rotate. Mercury's real per-orbit advance is 7e-7 rad (43 arcsec per century); here you can dial it up to 0.1 rad per orbit so the precession is visible immediately.

What to look for: at alpha = 0 the orbit traces over itself and the red perihelion dots all land on the same spot. Drag alpha up and the dots fan out into a rosette pattern; the four most recent orbits are drawn in fading blue so you can see the rotation. Pushing eccentricity up shrinks the periastron and amplifies the precession.

Controls: alpha sets the strength of the 1PN correction, e sets the orbit's eccentricity, speed controls integration steps per frame. Reset starts a new orbit from aphelion on the +x axis.

## Reference

Misner, Thorne, Wheeler 1973, Gravitation, Section 25.5; Binney and Tremaine 2008, Galactic Dynamics 2e, Section 3.6.

## Verification

- Strong invariants: Newtonian limit alpha = 0 gives per-orbit advance < 0.005 rad. Linear scaling: a2/a1 ~ 4 for alpha2 / alpha1 = 4. Energy drift < 5e-4. Angular momentum to 1e-6.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
