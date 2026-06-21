# Torque-free rigid body: the polhode

A rigid body tumbles in space with no torque on it. In the body frame its
angular velocity obeys Euler's equations; the orientation rides along on a unit
quaternion. Two quantities are exactly conserved, the rotational energy and the
magnitude of the angular momentum, and together they confine the spin axis to a
single closed curve, the polhode, drawn on the inertia ellipsoid. The scene
shows the ellipsoid tumbling with the instantaneous spin axis (white) and the
angular momentum (gold), which stays fixed in space because nothing twists the
body.

Spin near the long or the short principal axis and the polhode is a tight closed
loop: a steady, boring tumble. Spin near the intermediate axis and the polhode
runs along the separatrix, the bowtie in the lower plot, and the body flips end
over end, again and again, with energy and angular momentum unchanged through
every flip. This is the same intermediate-axis instability as the tennis-racket
theorem, seen here as the geometry of the polhode.

The `spin axis` selector chooses which principal axis to spin about; `spin rate`
sets the speed and `nudge` the small transverse perturbation that seeds the
flip. `asymmetry` reshapes the ellipsoid (more elongated means faster, more
violent middle-axis flips). Pause freezes the tumble; Reset restores the
defaults. The lower plot traces the live spin axis in the omega1-omega3 plane
against the analytic polhode for the current energy and angular momentum.

## Reference

Primary citation: Goldstein, Poole, Safko, *Classical Mechanics*, 3rd ed.,
Sec. 5.6; Landau and Lifshitz, *Mechanics*, 3rd ed., Sec. 37.

## Verification

- Strong invariant: rotational energy and |L|^2 conserved (relative drift
  < 1e-3 over 1e4 RK4 steps).
- Intermediate-axis spin flips sign; major/minor-axis spin does not.
- Live readout: energy and |L| relative drift, shown in the rail.
