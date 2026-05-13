# Predator-prey and the Hopf bifurcation

The Rosenzweig-MacArthur model has prey growing logistically (carrying
capacity K) and predators preying via the saturating Holling Type II
response. The coexistence equilibrium is stable for small K. Above the
Hopf threshold K_H = 0.7 (for the chosen parameters), the equilibrium
loses stability through a supercritical Hopf bifurcation and a stable
limit cycle emerges. The amplitude of the cycle grows as sqrt(K - K_H)
near the bifurcation. This is the "paradox of enrichment": more prey
food makes the system more unstable, not less.

Look for: at K = 0.5 the trajectory damps into a tight spiral around
(0.2, 0.17) (green equilibrium marker). Slide K above 0.7 and the spiral
diverges into a closed loop. The loop grows with K. At K near 2 the loop
becomes very wide and the prey nearly goes extinct in each cycle.

Use the K slider to sweep across the bifurcation. Speed controls
animation rate. Reset re-initializes near the equilibrium.

## Reference

- Strogatz, Nonlinear Dynamics 2e Ch. 8.
- Rosenzweig and MacArthur 1963.

## Verification

- Strong invariant: equilibrium is a fixed point; limit-cycle amplitude
  at K = 1.5 above the Hopf threshold; non-negative populations.
- Visual gate: SSIM > 0.92 across 5 frames showing phase orbit and time
  series.
- Last verified: see `.verified`.
