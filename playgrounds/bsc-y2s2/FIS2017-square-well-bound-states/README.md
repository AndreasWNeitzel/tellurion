# Bound states of the finite square well

Trap a quantum particle in a box with walls of finite height and only a handful of energies are allowed. Inside the well the wavefunction oscillates; outside it leaks into the classically forbidden region as a decaying exponential; and a state can exist only if these pieces join smoothly, matching in value and slope at both walls. That smoothness is a strict condition, met at just a discrete set of energies, the bound states. The top panel draws the well with its levels labelled, and the wavefunction of the level you click riding on its energy line: the ground state is nodeless and even, and each step up the ladder adds one node and flips parity, even, odd, even.

Writing $z = kL/2$ and $z_0 = \tfrac{L}{2}\sqrt{2mV_0}/\hbar$, the matching collapses to two transcendental equations, $z\tan z = \sqrt{z_0^2 - z^2}$ for the even states and $z\cot z = -\sqrt{z_0^2 - z^2}$ for the odd ones. The bottom panel solves them the way you would by hand: the even (blue) and odd (orange) branches climb while a circle of radius $z_0$ falls, and every crossing is an allowed level. Click a level and its crossing lights up. The energies come out as $E_n/V_0 = (z_n/z_0)^2$, found by real root-finding on the equations, not assumed.

The depth and width sliders grow or shrink $z_0$: a bigger circle sweeps past more branches and admits more states, the count being $\lfloor z_0/(\pi/2)\rfloor + 1$. Shrink the well toward nothing and the states drop out one by one, but one even state always survives, since a one-dimensional well, however shallow, always binds at least one particle.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 2nd ed., Sec. 2.6 (the finite square well); Gasiorowicz, *Quantum Physics*, 3rd ed., Ch. 5.

## Verification

- Strong invariants: the number of bound states is $\lfloor z_0/(\pi/2)\rfloor + 1$ (always at least one); each level solves its transcendental matching condition; the n-th state has n interior nodes and parity $(-1)^n$.
- Visual gate: SSIM against committed golden frames at both folds.
