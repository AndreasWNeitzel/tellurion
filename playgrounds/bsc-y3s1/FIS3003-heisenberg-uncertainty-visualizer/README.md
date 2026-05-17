# The Heisenberg Uncertainty Seesaw

A quantum state does not have a position and a momentum; it has a
wavefunction, and that wavefunction looks different in the two
conjugate spaces. The top panel is the position density |psi(x)|^2,
the bottom is its Fourier transform, the momentum density |phi(k)|^2,
each with its standard deviation drawn as a width bar. A slow
breathing squeezes the state so you can watch the seesaw: every time
the position packet narrows, the momentum packet has to broaden.

The gauge on the right tracks the product sigma_x sigma_p. It can
never fall below hbar/2: that line is the floor of quantum mechanics.
A Gaussian is the one shape that touches it exactly, no matter how
hard you squeeze, which is why the bar sits precisely on the line and
the readout holds at 0.5000. Switch to a box, a triangle or a
double-bump state and the bar jumps above the line: those states are
strictly more uncertain than they have to be.

The shape selector chooses the wavefunction; the squeeze slider sets
the base width; the breathing selector turns the live seesaw on or
off. Reset returns to a unit Gaussian and Pause freezes it. The
readout reports both widths, the product, and whether the state is at
or above the bound.

## Reference

Primary citation: Griffiths, *Introduction to Quantum Mechanics*
(3rd ed.), Sec. 1.6 (`griffiths-qm`).

## Verification

- Strong invariant: a Gaussian saturates sigma_x sigma_p = 1/2 within
  2%; every shape obeys >= 1/2; the Fourier transform is unitary in
  both spaces to 1e-6.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
