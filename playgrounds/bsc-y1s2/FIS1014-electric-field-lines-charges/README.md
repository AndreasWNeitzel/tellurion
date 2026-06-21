# Electric field lines from point charges

Four canonical point-charge configurations (dipole, two like positives,
quadrupole, single monopole) with their field-line patterns traced as
integral curves of E and drawn over a field-magnitude map. Line density on
the plane is proportional to |E|, which is Gauss's law, not just a drawing
convention. Marching arrowheads show the field direction, out of positive
charges and into negative ones.

Look for: the dipole's classic bridge from + to -; the repulsion pattern
between two like + charges with a zero-field point at the midpoint (a clean
zero in the lower plot); the quadrupole's four-lobe alternation; the
monopole's radial starburst. The lower plot is the field magnitude along
the horizontal axis: it spikes at the charges and dips at the nulls.

Use the layout selector to switch configurations and the density slider to
set how many lines each charge emits. Drag any charge with the pointer and
every line and the magnitude map retrace live. Pause freezes the flow and
Reset restores the defaults.

## Reference

- Griffiths, Introduction to Electrodynamics 4e Ch. 2.

## Verification

- Strong invariant: monopole 1/r^2 within 1 percent; dipole-midpoint
  E along axis; two-like midpoint E = 0; quadrupole decays faster than
  monopole; sign reversal exact.
- Live readout: div E = 0 in vacuum (Gauss's law), checked by central
  differences at a fixed probe point in empty space.
