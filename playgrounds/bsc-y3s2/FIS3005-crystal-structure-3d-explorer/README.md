# Crystal Structure Explorer

Three cubic crystals, simple, body-centred and face-centred, drawn as
spinning ball-and-stick models with the nearest-neighbour bonds so you
can see how the atoms actually sit. A Miller plane cuts the cell and
the atoms lying on it are picked out in gold. The strip at the bottom
is the powder diffraction pattern those planes produce, and the
reciprocal-lattice view shows the dual lattice with the G(hkl) vector
and its Bragg plane, the Brillouin-zone face from the perpendicular
bisector of G. The view rescales itself to its content, so any
supercell, lattice, or rotation stays inside the frame.

What to look for: switch between SC, BCC and FCC and watch the powder
lines. SC shows every reflection (1, 2, 3, 4, ...). BCC is missing
half of them and starts at 2, 4, 6, 8; FCC starts at 3, 4, 8, 11.
Those gaps are not accidental: the extra atoms in the cell make the
structure factor cancel for the forbidden reflections, which the
readout confirms (FCC(111) sums to 4, BCC(100) to 0). Change the
Miller indices and the highlighted plane tilts, the gold on-plane
atoms update, and the reported spacing follows a over root h-squared
plus k-squared plus l-squared.
In the reciprocal view the readout names the Brillouin zone: a cube
for SC, a rhombic dodecahedron (12 faces) for BCC, a truncated
octahedron (14 faces) for FCC.

Controls: the lattice selector switches structure; the view selector
swaps between the crystal and its reciprocal lattice; the Miller
selector picks the plane; the supercell slider tiles the cell; Reset
returns to FCC(111).

## Reference

Primary citation: Kittel, *Introduction to Solid State Physics*
(8th ed.), Ch. 1-2 (`kittel-cm`); Ashcroft and Mermin, *Solid State
Physics*, Ch. 4-6 (`ashcroft-mermin`).

## Verification

- Strong invariant: the reciprocal basis satisfies b_i.a_j = 2 pi
  delta_ij to 1e-10; the cubic d-spacings and the SC/BCC/FCC
  structure-factor absences and powder sequences are exact; atoms
  per cell are 1/2/4; and the Brillouin-zone face counts are 6/12/14.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
