# Tight-Binding Band Structure

Almost everything about how electrons move in a crystal comes from
one number: how easily an electron hops from one atom to the next.
Feed that hopping into Bloch's theorem and a sharp atomic level
spreads into a band. This playground draws that band three ways: the
1D chain, the dimerized SSH chain, and the 2D square lattice.

What to look for: in 1D the band is a clean cosine of width 4t, and
the density-of-states panel spikes at the two band edges, the van
Hove singularities. Drag the Fermi level and the filled part of the
band lights up green; at mid-band it is exactly half full. Switch to
SSH and slide the dimerization: when the two hoppings are unequal a
gap opens at the zone boundary (an insulator), and it slams shut when
they are equal. Switch to 2D and the band becomes a colour map with a
green Fermi surface you can grow by dragging E_F; at half filling it
locks onto the perfect diamond that gives the square lattice its
nesting instability.

Controls: the lattice selector chooses 1D, SSH or 2D; hopping t sets
the bandwidth; dimerization sets the SSH gap; the Fermi-level slider
fills the band or sizes the Fermi surface; Reset returns to the 1D
half-filled chain.

## Reference

Primary citation: Kittel, *Introduction to Solid State Physics*
(8th ed.), Ch. 7-9 (`kittel-cm`); Ashcroft and Mermin, *Solid State
Physics*, Ch. 10 (`ashcroft-mermin`).

## Verification

- Strong invariant: the 1D dispersion gives E = eps +- 2t at the
  zone centre and edge with bandwidth 4t and the correct band-edge
  effective mass; the SSH gap is exactly 2|t1-t2| and the closed
  form equals the 2x2 Bloch eigenvalue; the 2D band has its extrema
  and van Hove saddle at the right points; and the 1D DOS integrates
  to one with edge divergences.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
