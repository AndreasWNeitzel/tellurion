# The variational method

Almost no quantum system can be solved on paper, so physicists lean hard on a theorem that turns a guess into a guarantee. The variational principle says that if you take any normalized trial wavefunction and compute its energy expectation $\langle H\rangle$, the answer can never be lower than the true ground-state energy $E_0$. Equality holds only when your guess is the exact ground state. That one-way inequality is enormously useful: build a trial state with an adjustable parameter, evaluate $\langle H\rangle$, and slide the parameter until the energy is as low as you can drive it. The minimum is your best estimate, and because of the theorem you know it sits above the true answer rather than fooling you from below.

This playground runs the method on the hydrogen atom with a Gaussian trial $e^{-a r^2}$, a deliberately imperfect choice that is also deeply practical, since stacks of Gaussians are exactly what quantum-chemistry programs use to model real molecules. The scene shows why the choice is imperfect. The true hydrogen ground state $e^{-r}$ comes to a sharp point at the nucleus, a cusp forced by the Coulomb singularity, while any Gaussian arrives flat-topped and smooth. No single Gaussian can put a kink where the physics demands one, and that structural mismatch costs energy. The best Gaussian reaches $\langle H\rangle = -0.424$ Hartree against the exact $-0.5$, close but visibly short.

The lower panel is the variational principle made literal. It plots $\langle H\rangle$ as the trial width $a$ varies: the curve falls to a single minimum at $a^\ast = 8/9\pi$ and then rises again, and across the whole range it stays above the shaded forbidden zone beneath $E_0 = -0.5$. Sweep the width and the marker rides the curve but never breaks through the floor. The energy bar on the right splits $\langle H\rangle$ into its kinetic and potential parts, and at the optimum they settle into the virial relation $2\langle T\rangle = -\langle V\rangle$, the same balance the exact atom obeys.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 3rd ed., Cambridge, 2018, Ch. 7; Szabo and Ostlund, *Modern Quantum Chemistry*, Dover, 1996, Ch. 3.

## Verification

- Strong invariants: the trial energy is an upper bound, $\langle H\rangle \ge E_0$, for every width; the minimum is at $a^\ast = 8/(9\pi)$ with value $-4/(3\pi)$; the bound is strictly above the exact energy (the cusp cannot be matched); the trial wavefunction is normalized and the virial relation holds at the optimum.
- Visual gate: SSIM against committed golden frames at both folds.
