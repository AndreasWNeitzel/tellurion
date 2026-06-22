# Quantum tunneling through a barrier

Fire a quantum particle at a wall too tall to climb and it sometimes comes out the other side. Classically a particle with energy below the barrier height is turned back every time; the wave is not. It does not stop dead at the wall, it bends into an exponential that decays across the barrier, and if the barrier is thin enough a sliver of amplitude survives to the far side and resumes travelling. The top panel animates the real part of that wave: the standing-wave ripple of incident plus reflected on the left, the decay inside the orange barrier, and the smaller transmitted wave leaving on the right, all riding inside the static green probability envelope. The leaked fraction is the transmission $T = [1 + V_0^2\sinh^2(\kappa L)/(4E(V_0-E))]^{-1}$, which shrinks exponentially as the barrier thickens or rises, the delicate mechanism behind alpha decay, the scanning tunneling microscope, and fusion in the Sun.

Above the barrier the story flips. The particle is not guaranteed through; the step acts as a partial mirror that reflects some of the wave. But at special energies where exactly a half-integer number of wavelengths fits across the barrier the internal reflections cancel and transmission becomes perfect. The bottom panel tracks $T$ and $R$ against energy: the tunneling tail climbing out of zero below $V_0$ (the tinted region), and the resonance comb above it, the marked points where $T$ touches one. The two always sum to one, all the probability accounted for.

The energy slider moves the operating point along these curves; the height and width sliders reshape the barrier and recompute the wave. Start below the barrier to watch a faint wave tunnel through, widen the barrier to choke it off, then raise the energy past $V_0$ to find the resonances.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 2nd ed., Sec. 2.6 and Prob. 2.33; Cohen-Tannoudji, *Quantum Mechanics*, Vol. I, Ch. 1.

## Verification

- Strong invariants: probability current is conserved, $T + R = 1$; tunneling transmission falls as the barrier thickens or rises; above the barrier $T = 1$ at the resonances $k_2 L = n\pi$. The wavefunction is integrated from the transmitted side and its transmission reproduces the closed form.
- Visual gate: SSIM against committed golden frames at both folds.
