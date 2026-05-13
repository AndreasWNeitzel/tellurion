# Harmonic Oscillator Coherent State

A coherent state |alpha> of the 1D quantum harmonic oscillator. The probability density |psi(x, t)|^2 is a Gaussian of fixed width 1/sqrt(2) whose mean follows the classical orbit x_0(t) = sqrt(2) Re(alpha e^{-i omega t}). Adjust alpha to set the orbit amplitude; press play to watch the wave packet oscillate without spreading (the defining property of a coherent state).

Controls: alpha slider, speed slider, pause/play, reset.

## Reference

Sakurai-Napolitano, "Modern Quantum Mechanics", 3rd ed., Section 2.4 (Coherent states). Verified in chapter_index.

## Verification

- <n> = |alpha|^2 and <H>/(hbar omega) = |alpha|^2 + 1/2 exact closed forms.
- Classical orbit (x_0, p_0) has period 2 pi/omega within 1e-12.
- Density integrates to 1 over a wide window; second moment about x_0 equals 1/2 to 1e-4.
- |psiRealImag|^2 matches density(x, alpha, t) to 1e-10.
