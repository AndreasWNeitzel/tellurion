# Kuramoto oscillators and synchronization

128 phase oscillators with intrinsic frequencies drawn from a Lorentzian
distribution. Each oscillator pulls toward the global mean direction
with strength K. Below the critical coupling K_c = 2 gamma the
oscillators are incoherent (scattered around the unit circle); above
K_c they partially synchronize into a coherent cluster. The order
parameter r grows as sqrt(K - K_c) at the transition.

Look for: at K = 0, dots scatter uniformly and the orange order-parameter
arrow shrinks toward the center (r ~ 1/sqrt(N) only). Slide K above
K_c = 1 (for default gamma = 0.5) and a cluster forms; the arrow grows.
At K = 4, the cluster is dense and r > 0.7. The right panel shows the
r(t) trace converging to its steady-state value.

Use K to set coupling and gamma to set frequency spread. Speed controls
animation rate. Reset re-draws random initial phases.

## Reference

- Kuramoto 1984 (`kuramoto1984`).
- Strogatz, Nonlinear Dynamics 2e Ch. 8.

## Verification

- Strong invariant: r in [0, 1]; K = 0 r < 0.3; K = 4 r > 0.5;
  K_c = 2 gamma exact.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
