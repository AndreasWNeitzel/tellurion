# Inclined plane with Coulomb friction

A unit-mass block sits at the top of a slope of angle $\theta$ with static friction $\mu_s$ and kinetic friction $\mu_k$. Below threshold $\tan\theta \le \mu_s$ the block is held by static friction. Above threshold it slides downhill at constant acceleration $a = g(\sin\theta - \mu_k \cos\theta)$, with closed-form $v(t) = a t$ and $x(t) = \tfrac{1}{2} a t^2$.

Look for the regime transition as you raise $\theta$: at $\theta = \arctan(\mu_s)$ the readout flips from "static" to "sliding" and the velocity curve switches from a flat zero line to a tilted ramp. With $\mu_k$ tuned close to $\tan\theta$ the block creeps almost imperceptibly. The numerical $v(t)$ plotted on the right overlays the analytic line to machine precision because velocity-Verlet is exact for constant acceleration.

Sliders control $\theta$, $\mu_s$, $\mu_k$, and a playback speed multiplier. Reset restarts the block at the top of the slope. The Play / Pause button suspends time without resetting parameters. Keyboard focus follows the standard tab order; no special shortcuts.

## Reference

Primary citation: Marion and Thornton, *Classical Dynamics of Particles and Systems*, 5e, Ch. 2 (`marion-thornton`).

## Verification

- Strong invariant: $\theta_c = \arctan(\mu_s)$ exact and analytic $v(t) = a t$ within $10^{-12}$.
- Energy budget closes within $10^{-8}$ relative.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
