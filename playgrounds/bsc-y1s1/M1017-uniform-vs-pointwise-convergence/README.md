# Uniform vs pointwise convergence

A sequence of functions can converge in two quite different senses, and the gap between them is where a lot of analysis lives. Pointwise convergence is the modest claim that at each fixed $x$ the numbers $f_n(x)$ settle to a limit $f(x)$, each point minding its own business. Uniform convergence is the demanding claim that the entire graph settles together, that the worst-case vertical gap between $f_n$ and $f$, the sup-norm $\lVert f_n - f\rVert_\infty$, shrinks to zero. The first does not imply the second. Sweep the index $n$ and watch the family evolve: the limit is the dashed curve, $f_n$ the solid one, and the red bar marks the single worst point, the height of the sup-norm.

For $x^n$ on $[0,1]$ every point below one tends to zero, yet a stubborn shoulder near $x=1$ keeps the gap at one, and the limit ends up discontinuous, a jump that uniform convergence would have forbidden. The bump examples are starker: a spike of fixed height (the sliding bump) or even growing height (the tall bump) slides toward the edge, so $f_n(x)\to 0$ at every fixed point while the sup-norm stays at one or runs off to infinity. Only the flattening ramp $x/n$ converges uniformly, its whole graph pressed down to zero together. The bottom panel plots the sup-norm against $n$, the one number that distinguishes the cases: it descends to zero exactly when convergence is uniform.

Next sequence cycles the four, max n sets how far the sweep climbs, and the purple probe is draggable: its value $f_n(x_0)$ always settles, demonstrating pointwise convergence even on the sequences whose sup-norm never falls.

## Reference

Rudin, *Principles of Mathematical Analysis*, 3rd ed., Sec. 7.1-7.2 (uniform convergence); Abbott, *Understanding Analysis*, 2nd ed., Sec. 6.2.

## Verification

- Strong invariants: every sequence converges pointwise ($f_n(x_0) \to f(x_0)$); uniform convergence holds iff the sup-norm goes to zero (true only for the ramp, false for the bumps and for $x^n$); the $x^n$ pointwise limit is discontinuous.
- Visual gate: SSIM against committed golden frames at both folds.
