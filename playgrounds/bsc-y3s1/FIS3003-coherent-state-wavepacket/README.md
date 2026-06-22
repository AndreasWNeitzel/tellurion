# The coherent state

A free wavepacket spreads as it moves, its width growing without bound, but the harmonic oscillator hides a family of states that never blur: the coherent states, first written down by Schrodinger and rediscovered by Glauber for the quantum theory of light. Take the ground state of the oscillator, displace it sideways, and release it. What you get is a Gaussian that keeps the exact ground-state width $\sigma_0=\sqrt{\hbar/2m\omega}$ for all time while its centre slides along the classical trajectory $\langle x\rangle(t)=x_0\cos\omega t$. It is the closest thing quantum mechanics has to a classical particle: a minimum-uncertainty blob that oscillates in the well forever without ever spreading. The scene shows the parabolic potential, the energy level, and the live packet riding on it, sloshing between the classical turning points.

The cyan curve is the real part of the wavefunction. Its envelope is the same fixed Gaussian, but the carrier underneath it wiggles fastest as the packet whips through the centre of the well, where the mean momentum is largest, and smooths out at the turning points, where the packet momentarily stops. That changing wavelength is the de Broglie relation playing out in real time: short wavelength where the motion is fast, long where it is slow.

The lower panel makes the classical analogy exact. The phase-space point $(\langle x\rangle,\langle p\rangle)$ traces a closed ellipse, the very orbit a classical oscillator of the same energy would follow, going clockwise once per period. Beside it, the energy splits into a kinetic part and a potential part that trade back and forth as the packet swings (all kinetic at the centre, all potential at the turns) while their sum, plus the irreducible zero-point $\tfrac12\hbar\omega$, stays fixed. Raise the amplitude and the packet shrinks against its swing, sharpening the classical limit; raise the frequency and the stiffer well squeezes the packet narrower.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 3rd ed., Cambridge, 2018, Problem 3.35; Cohen-Tannoudji, Diu, Laloe, *Quantum Mechanics*, Complement G_V; Shankar, *Principles of Quantum Mechanics*, 2nd ed., Ch. 21.

## Verification

- Strong invariants: the position variance stays at $\sigma_0^2$ for all times (the defining no-spreading property) to 1e-4; the phase point lies on its energy ellipse to 1e-6; the Ehrenfest relation $d\langle x\rangle/dt=\langle p\rangle$ holds to 1e-5; the density stays normalized.
- Visual gate: SSIM against committed golden frames at both folds.
