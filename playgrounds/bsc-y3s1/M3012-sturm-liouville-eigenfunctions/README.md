# Sturm-Liouville eigenfunctions

The eigenfunctions of $-y'' = \lambda y$ with Dirichlet boundaries on $[0, \pi]$ are $\phi_n = \sqrt{2/\pi}\sin(nx)$ with eigenvalues $\lambda_n = n^2$. They form a complete orthonormal basis for $L^2[0, \pi]$, and any function can be expanded in this basis.

Look for the bottom-panel target $f(x) = x(\pi - x)$ getting better approximated as you increase $N$; the max-error readout drops by orders of magnitude. Only odd modes contribute (the function is even about $\pi/2$).

One slider: number of modes $N$.

## Reference

Primary citation: Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 8 (`arfken-weber`).

## Verification

- Strong invariants: $\lambda_n = n^2$ exact; $\langle \phi_n, \phi_m \rangle = \delta_{nm}$ within $10^{-6}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
