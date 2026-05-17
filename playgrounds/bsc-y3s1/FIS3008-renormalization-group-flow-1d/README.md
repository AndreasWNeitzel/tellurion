# 1D Ising Renormalization-Group Flow

The renormalization group asks what happens to a model when you look
at it from further away. Here "further away" is decimation: sum every
other spin out of the 1D Ising chain. The survivors are still an
Ising chain, but with shifted coupling and field given by an exact
closed-form map. Iterating that map is the RG flow. The plane is
(tanh K, h) so the whole temperature axis fits in a finite box: the
left edge is infinite temperature, the right edge is absolute zero.

What to look for: drag the white start marker anywhere and trace its
trajectory. It always drifts left, into the green sink at the origin.
There is no fixed point at any finite temperature, which is the exact
statement that the 1D Ising chain has no phase transition: cool it as
much as you like and decimation still washes the order away. The only
special point is the unstable red one at the right edge, the
zero-temperature transition. Switch to the cobweb view to see the
zero-field map K' = 1/2 ln cosh 2K staircase monotonically down to
zero. The free-energy readouts are the check: summing the per-step
constants along the flow reproduces the exact transfer-matrix free
energy to six figures.

Controls: start K and start h set the initial couplings (or drag in
the plane); RG steps sets how far the trajectory is traced; the view
selector switches between the flow plane and the cobweb; Reset
restores the default.

## Reference

Primary citation: Goldenfeld, *Lectures on Phase Transitions and the
Renormalization Group*, Ch. 9 (`goldenfeld`); Nelson and Fisher,
*Annals of Physics* 91, 226 (1975) (`nelson-fisher1975`).

## Verification

- Strong invariant: the decimation recursion matches a brute-force
  spin sum to 1e-10; the correlation length halves exactly under
  b = 2; and the free energy reconstructed from the RG flow equals
  the exact transfer-matrix result to 1e-9 everywhere.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
