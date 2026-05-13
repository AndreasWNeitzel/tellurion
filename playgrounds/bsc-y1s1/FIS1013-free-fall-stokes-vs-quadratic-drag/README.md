# Free fall under three drag laws

Three balls dropped from the same height at $t = 0$ under vacuum, Stokes drag ($F = -bv$), and quadratic drag ($F = -c|v|v$). All three accelerate downward initially but the drag balls plateau at their terminal velocities: $v_t^{(S)} = mg/b$ for Stokes and $v_t^{(Q)} = \sqrt{mg/c}$ for quadratic. Vacuum is the well-known $v = -gt$.

Look for the qualitative shapes in the $|v(t)|$ plot: linear (vacuum), exponential approach to plateau (Stokes), tanh-like approach (quadratic). The dashed reference lines mark the analytic terminal velocities. Whichever ball plateaus higher arrives faster at the ground; usually the quadratic ball has the lowest terminal because it accelerates harder at small $v$ and bites harder at high $v$.

Three sliders set the drop height $y_0$ and the two drag coefficients $b, c$. Reset returns the balls to the top; Play / Pause toggles time.

## Reference

Primary citation: Marion-Thornton, *Classical Dynamics of Particles and Systems*, 5e, Ch. 2 (`marion-thornton`).

## Verification

- Strong invariants: vacuum $v = -gt$ exact; Stokes terminal $mg/b$ to $10^{-6}$; quadratic terminal $\sqrt{mg/c}$ to $10^{-3}$; analytic Stokes $v(t)$ matches RK4 to $10^{-6}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
