# Hydrogen in Electric and Magnetic Fields

Left of frame is hydrogen's term diagram, the n = 1..4 Rydberg
levels. Apply a magnetic field and each level fans into equally
spaced sublevels, dE = mu_B B m_l, the normal Zeeman effect; apply an
electric field and the excited shells shear linearly because hydrogen
is degenerate, the linear Stark effect. The transition you pick is
drawn as the arrow, and on the right the synthetic spectrum shows
what a spectrometer would actually record: the single line breaking
into the field-split multiplet, zoomed in so you can resolve it.

The point to watch is the ground state. Every excited level fans, but
n = 1 stays exactly where it is under the electric field: it has no
first-order Stark shift, because the 1s state is non-degenerate and
has no permanent dipole. Only a tiny second-order pull-down survives.
A magnetic field, by contrast, splits even the simplest line into the
Lorentz triplet, with the spacing growing in proportion to B.

The transition selector chooses the spectral line; the Zeeman slider
sets B in tesla; the Stark slider sets the electric field. Reset
returns to Balmer-alpha at moderate fields and Pause freezes the
field ramp. The readout gives the splitting and the component count.

## Reference

Primary citation: Griffiths, *Introduction to Quantum Mechanics*
(3rd ed.), Ch. 6 (`griffiths-qm`).

## Verification

- Strong invariant: no first-order Stark shift for n=1 at any field;
  the Zeeman splitting is exactly mu_B B per m and linear in B; zero
  field restores full degeneracy.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
