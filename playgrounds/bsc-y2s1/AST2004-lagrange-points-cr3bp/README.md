# Lagrange points of the circular restricted three-body problem

Two heavy bodies orbit each other (yellow primary, blue secondary). A test particle moves under their combined gravity in the frame that rotates with them. Five special points (L1-L5) are equilibria where the particle can sit still. L4 and L5 form equilateral triangles with the primaries and are linearly stable when mu < 0.0385 (Routh).

What to look for: drop a particle near L4 or L5 with the buttons. At low mu (Earth-Moon, Sun-Jupiter) it traces a small "tadpole" orbit around the equilibrium. Crank mu up past 0.04 and the L4 / L5 librator escapes. Click anywhere to drop a particle at the cursor with zero rotating-frame velocity.

Controls: mu sets the mass ratio (default 0.01215, Earth-Moon). Speed sets integration rate.

## Reference

Binney and Tremaine 2008, Galactic Dynamics 2e, Section 3.3; Murray and Dermott 1999, Solar System Dynamics, Chapter 3.

## Verification

- Strong invariants: L4/L5 exact coordinates, L1 Hill-radius location, mu_Routh formula, Jacobi conservation < 1e-6 on a tight L4 orbit, escape past mu_R.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
