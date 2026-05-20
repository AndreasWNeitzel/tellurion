# Wormhole Legend

Four-mode laboratory for the Morris-Thorne / Ellis traversable
wormhole. The same throat radius b_0 is shared across modes.

## Modes

- **Overview**: WebGL2 ray-marched view of the throat (recycled
  wormhole-3d shader). The two universes' starfields bleed through
  each other via photons with impact parameter |L/E| < b_0.
- **Traversal**: animated POV camera flying along the proper-distance
  coordinate l from one universe through the throat into the other,
  with a progress bar showing the camera position relative to the
  throat. No event horizon, no singularity; the experience is
  continuous.
- **Embedding**: 3D mesh of the equatorial slice
  r(l) = sqrt(b_0^2 + l^2), z(l) = b_0 asinh(l/b_0): the iconic
  two-funnel paraboloid joined at the throat (highlighted yellow
  ring at the narrowest waist).
- **Exotic**: rho(l) (negative at the throat, Morris-Thorne formula),
  running ANEC integral (always negative; NEC-violating), and tidal
  scale 1/r(l)^2 a traveller would feel. The catch with traversable
  wormholes is here: classical matter cannot do this.

## What to look for

- Slide b_0: the throat widens; tidal forces fall as 1/b_0^2.
- Switch to Traversal mode: watch the second universe's starfield
  open up through the throat as the camera approaches and crosses.
- In Embedding mode, see the iconic figure-8 saddle surface; rotate
  the orbit camera to see the two funnels.

## Source

Morris and Thorne, *Am. J. Phys.* 56 (1988) 395
(`morris-thorne-wormhole-1988`); Ellis, *J. Math. Phys.* 14 (1973)
104 (`ellis-drainhole-1973`); Misner, Thorne and Wheeler,
*Gravitation*, W. H. Freeman 1973, Box 13 (`mtw-gravitation`);
Visser, *Lorentzian Wormholes*, AIP Press 1995.
