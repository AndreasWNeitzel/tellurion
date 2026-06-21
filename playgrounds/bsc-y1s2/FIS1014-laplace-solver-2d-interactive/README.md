# Interactive Laplace solver

In a charge-free region the electric potential obeys Laplace's equation: every
point is exactly the average of its neighbours, with no peaks or dips of its own.
That gives a simple way to solve for the field of any conductors: start from a
flat guess and repeatedly replace each free cell with the average around it
(red-black successive over-relaxation). The potential ripples and settles into
the unique solution fixed by the conductors. The scene shows that relaxation
live, as a diverging colour map with equipotential contours, replaying on a loop
so the field is always seen finding its shape.

Look for the equipotential lines snapping into place as the field converges, and
the field meeting every conductor perpendicular (a conductor surface is an
equipotential). Try the coaxial cable for evenly spaced rings (the logarithmic
potential of a cable), or paint your own electrodes and watch the solver work
around them in real time.

Use the setup selector for a classic geometry and the brush selector (paint +1,
-1, ground, or erase); drag on the canvas to paint conductors. Pause freezes the
solver and Reset restores the default parallel plates.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Ch. 3;
Press et al., *Numerical Recipes*, Sec. 20.5.

## Verification

- Strong invariants: the SOR residual decays toward zero; the converged interior
  is harmonic (max discrete Laplacian below 5e-3); parallel-plate field E = V/d
  within 1%; coaxial potential follows A ln r + B within 0.5%.
- Live readout: max |laplacian of phi| over the free interior, in the rail.
