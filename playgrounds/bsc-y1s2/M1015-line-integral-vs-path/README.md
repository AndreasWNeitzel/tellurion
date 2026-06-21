# Line integrals and path independence

A vector field F = (P, Q) in the plane with three routes from A to B: a straight
line, a semicircular arc, and a bent path with a draggable handle. The line
integral of F.dr adds up the field's push along the route. For a conservative
field (P_y = Q_x, the gradient of a potential) every route gives the same value
and a closed loop is zero; for a field with curl the routes disagree and a round
trip nets the circulation, which by Stokes equals the curl over the enclosed area.

The playground opens on a conservative field and draws its equipotential
contours in green. The field crosses them at right angles, and the line integral
from A to B is just the potential difference phi(B) - phi(A), the number of
contours you cross, which is the same for every route. The endpoint potentials
are labelled, and the lower plot shows the three running integrals all landing on
that same value. Switch to a non-conservative field (rotation or shear) and the
contours disappear (no potential exists), the three curves split to different
final values, and a closed loop nets the circulation, which by Stokes equals the
curl over the enclosed area.

Use the field selector (grouped into conservative and non-conservative) and the
routes selector (all three, or closed loop); drag the endpoints A and B and the
bent-path handle. Pause freezes the travelling markers and Reset restores the
conservative field.

## Reference

Primary citation: Riley, Hobson, Bence, *Mathematical Methods for Physics and
Engineering*, 3rd ed., Ch. 11.

## Verification

- Strong invariants: conservative fields have zero closed-loop integral within
  1e-6 and the integral equals the potential difference; rotation field gives a
  closed loop of pi (Stokes); the bent Bezier path agrees with the straight one
  when the field is conservative.
- Live readout: the closed-loop integral equals curl times enclosed area
  (Stokes), checked each frame in the rail.
