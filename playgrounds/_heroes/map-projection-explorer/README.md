# Map Projection Explorer

What it shows: twelve classic map projections of the globe, with the
graticule, the Blue Marble Earth texture, and a grid of Tissot
indicatrices. The
indicatrix is the image of a small circle on the sphere; its shape is
the local distortion. A circular indicatrix means a conformal point
(angles kept), an equal-area indicatrix means an equal-area point
(area kept). No projection can do both everywhere, by Gauss's
Theorema Egregium.

What to look for: switch to Mercator and the indicatrices stay
circular but inflate toward the poles, so area runs away while shape
is kept. Switch to Mollweide or Hammer and every indicatrix has the
same area but is squashed, so area is kept and shape is sacrificed.
The compromise projections, Winkel tripel and Robinson, keep both
distortions bounded. The diagnostic panel plots the area scale and
the angular distortion along the central meridian against latitude.

Controls: the projection selector switches between the twelve maps;
the toggles show or hide the graticule, the Earth texture, and the
indicatrices; dragging the canvas recentres the globe (a rigid
rotation, which adds no distortion of its own); Recentre returns the
view to the prime meridian and the equator.
