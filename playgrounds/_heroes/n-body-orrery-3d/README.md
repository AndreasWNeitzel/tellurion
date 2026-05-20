# 3D N-body Orrery

A miniature solar system in 3D under fourth-order symplectic integration
(Yoshida-4). Sun + 5 planets at small inclinations + 2 ghost asteroids
that start on identical orbits separated by one part in a million.

What to look for:
- The energy drift |dE|/E0 stays bounded forever (symplectic invariant).
- The ghost-asteroid separation grows exponentially with time
  (Hamiltonian chaos in the 4:3 Jupiter resonance region).
- Drag to orbit the camera; the dt slider sets integrator step size,
  the substeps slider sets how fast simulated time flows per frame.

Engine: shared/js/engine/symplectic.js (Yoshida-4). Force model:
Plummer-softened Newton in 3D.
