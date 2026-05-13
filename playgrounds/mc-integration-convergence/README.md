# Monte Carlo integration and 1/sqrt(N) convergence

Estimate integral_0^1 (1 + 10(x - 0.5)^4) dx = 1.125 by plain uniform
MC and importance sampling with a Beta(2, 2) proposal. Both estimators
are unbiased; standard error shrinks as sigma / sqrt(N). The log-error
panel plots both estimators against a 1/sqrt(N) reference line.

Look for: at N = 16 the plain estimator can be off by 0.1 or more.
Double N and the typical error shrinks by sqrt(2) ~ 1.4x. The Beta(2, 2)
importance sampler is worse here because the proposal concentrates mass
where f is smallest. Optimal IS would use q proportional to |f|.

Use the log2(N) slider for sample count. Speed auto-sweeps. Reset
returns to N = 16384.

## Reference

- MacKay, Information Theory Ch. 29.

## Verification

- Strong invariant: plain MC matches EXACT within 0.05 at N = 1e5;
  SE scales as 1/sqrt(N).
- Visual gate: SSIM > 0.92 across 5 frames sweeping N.
- Last verified: see `.verified`.
