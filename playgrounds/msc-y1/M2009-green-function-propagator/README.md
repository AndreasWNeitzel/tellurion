# Green's Function: Building a Solution from Tent Responses

Here is a trick that runs through all of physics. Suppose you want to solve -u'' = f, where f is some complicated load along a string pinned at both ends. Instead of attacking the whole load at once, first answer a much simpler question: what shape does the string take if you poke it at a single point? That answer is the Green's function, and for this problem it is a simple tent, zero at both walls with a sharp corner exactly where you poked. Now here is the payoff: any load is just a row of pokes, so the full solution is the same row of tents, each one scaled by how hard the load pushes there, all added up.

What to look for: drag the tent and watch its corner follow your poke while the ends stay nailed to zero. Switch the source and notice the solution is always smoother than the source, a jagged or wiggly load still produces a gentle curve, because adding up tents averages everything out (mathematically, solving -u'' = f integrates twice). The bottom-right panel proves it worked: it plots -u'' - f, which sits at zero, meaning the tent recipe really did solve the equation. The faint tents in the middle panel are the actual pile being summed.

Controls: the source selector picks the load shape; the parameter slider changes its mode, width or position; the tent-position slider slides the poke point (grabbing it pauses the automatic sweep so you can place it yourself). Reset returns to the sine source; Pause stops the sweep.

## Reference

Primary citation: Arfken, Weber and Harris, Mathematical Methods for Physicists (Green's functions for the Sturm-Liouville boundary-value problem).

## Verification

- Strong invariant: G is symmetric (1e-12) and zero at both walls; u = integral G f satisfies -u'' = f (residual below 1e-4) and matches the direct tridiagonal solve to 1e-9.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
