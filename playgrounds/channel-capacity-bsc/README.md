# Binary symmetric channel and the repetition code

The simplest noisy-bit channel: each transmitted bit flips with
probability p. Shannon's noisy-channel coding theorem gives the capacity
C(p) = 1 - H(p) where H is the binary entropy. The capacity vanishes at
p = 0.5 (channel is useless) and equals 1 at p = 0 or 1. The repetition
code transmits each source bit n times and decodes by majority vote; its
bit-error-rate drops fast with n at fixed p < 0.5.

Look for: the top capacity curve is symmetric about p = 0.5 and zero
there. The bottom panel shows the repetition-code BER for n = 1, 3, 5,
7, 11. At p = 0.1, n = 3 gives BER 0.028, n = 11 gives 1.6e-6: a factor
of 17 000 improvement in error rate at the cost of 11x the channel uses.

Use the p slider for the flip probability. Speed auto-sweeps p. Reset
returns p to 0.1.

## Reference

- Cover and Thomas, Elements of Information Theory 2e Ch. 7
  (`cover-thomas`).

## Verification

- Strong invariant: capacity boundary values, symmetry, repetition-3
  formula, monotonicity in n, Monte Carlo simulation.
- Visual gate: SSIM > 0.92 across 5 frames sweeping p.
- Last verified: see `.verified`.
