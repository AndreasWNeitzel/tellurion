# Mode trapping in evolved stars

The top panel shows the buoyancy frequency N(r) of an evolved star, with a sharp composition glitch, and the displacement eigenfunction of the current g-mode. The bottom panel is the observable period-spacing diagram deltaP(P). Both come from solving the g-mode wave equation psi'' + (l(l+1) N^2/(omega^2 r^2)) psi = 0 as a real eigenvalue problem on that one N(r) profile, so the trapped eigenfunctions and the dips in the period spacing are two sides of the same calculation rather than independent curves.

Turn the glitch strength to zero and the spacing flattens to the asymptotic Pi_1 (here scaled to a red-giant-like 80 s) with every eigenfunction spread evenly across the cavity. Turn it up and the spacing develops dips; the modes that fall in the dips are trapped, ringing loudly on one side of the glitch (shown in gold), while the others propagate across the whole cavity (green). Moving the glitch outward changes the modulation period of the dips, because it tracks the buoyancy depth of the glitch, which is how the dip pattern locates the chemical discontinuity left by past convective mixing.

The glitch-strength and glitch-position sliders set A and x_g; the degree slider sets l. Pause freezes the oscillation phase; Reset returns to the default. The eigenvalue solve runs only when a parameter changes, and the mode index sweeps automatically.

## Reference

Aerts, Christensen-Dalsgaard and Kurtz, *Asteroseismology* (Springer, 2010), Ch. 3.4; Cunha et al., ApJ 805 (2015) 127; Mosser et al., A&A 618 (2018) A109.

## Verification

- Strong invariants: with no glitch the spacing is uniform at Pi_1; a glitch modulates it while keeping the mean at Pi_1; the most-trapped mode is concentrated on one side of the glitch; eigenfunctions are normalised and satisfy the boundary conditions.
- Visual gate: SSIM > 0.92 against committed golden frames.
