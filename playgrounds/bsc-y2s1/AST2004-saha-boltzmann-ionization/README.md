# Saha-Boltzmann hydrogen ionization

In a pure-hydrogen plasma in local thermodynamic equilibrium, the ionization fraction $x = n_+ / n_\text{tot}$ obeys the Saha equation $x^2 / (1 - x) = \mathrm{Saha}(T) / n_\text{tot}$, with a Saha factor $\propto T^{3/2} \exp(-\chi/k_B T)$. The $T^{3/2}$ prefactor pushes the half-ionization temperature down by an order of magnitude from the naive $\chi / k_B$.

Look for the $x(T)$ rise, the dashed red marker at $T_\text{ion}$ (where $x = 0.5$), and the blue dot at the slider's $T$. Increase $n$ to shift $T_\text{ion}$ up; decrease $n$ (low corona) to make hydrogen ionize at lower temperature.

Two sliders set $\log_{10}(n)$ and $T$.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 8 (`carroll-ostlie`).

## Verification

- Strong invariants: closed-form quadratic $x^2 + R x - R = 0$ satisfied exactly; bisection finds $T_\text{ion}$ with $|x - 0.5| < 0.005$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
