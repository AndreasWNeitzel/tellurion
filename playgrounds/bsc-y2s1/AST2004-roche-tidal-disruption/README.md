# Tidal disruption near a massive primary

80 self-gravitating particles in eccentric orbit around a heavy primary. As the cloud sweeps near pericenter the primary's tidal field stretches it; if the self-gravity coupling ("cohesion") is too low the cloud rips apart into a tidal stream. The Roche limit for an equal-density fluid satellite is r_R = 2.44 (dashed red ring).

What to look for: at a=3.5, e=0.55, cohesion=0.05 the cloud loops in past Roche each periastron and stretches into a long stream. Crank cohesion up to ~0.18 and it stays bound; drop to zero and it scatters even at large radii because of differential Kepler motion.

Controls: a (semi-major axis), e (eccentricity), cohesion (self-gravity strength), speed.

## Reference

Roche 1849; Binney and Tremaine 2008, Galactic Dynamics 2e, Section 8.2.

## Verification

- Strong invariants: initial cloud size matches rCloud, pericenter-inside-Roche orbits spread > 2x, zero-cohesion clouds always spread, CoM follows ellipse.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
