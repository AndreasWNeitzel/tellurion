# KAM Theory: The Standard Map

The Kolmogorov-Arnold-Moser theorem is one of the deepest results in
mechanics: it says that when you perturb an integrable system, most
of the invariant tori, the ones with sufficiently irrational
frequency ratios, survive. The Chirikov standard map is the cleanest
laboratory for watching them die. It is a single area-preserving
twist (the Jacobian determinant is exactly one, shown in the
readout), so this Poincare section is an honest Hamiltonian snapshot.

What to look for: at K = 0 the section is perfectly horizontal lines,
p is conserved. Nudge K up and the lines ripple; rational tori shred
first into chains of islands. The white curve is the golden-mean
torus, the most irrational and therefore the most robust one. Slide K
toward 0.9716 and it is the last clean curve standing, then it too
dissolves and a single connected chaotic sea floods the picture,
the golden-dp readout jumping from a thin band to the full cylinder.
That number, K_c, is Greene's, computed from the residues of
periodic orbits, and it marks the end of global confinement.

Controls: the stochasticity slider K is the order-to-chaos knob;
orbits and iterations set how densely the section is sampled; Reset
returns to a mildly perturbed map.

## Reference

Primary citation: Lichtenberg and Lieberman, *Regular and Chaotic
Dynamics* (2nd ed.), Ch. 4 (`lichtenberg-lieberman`); Goldstein,
Poole and Safko, *Classical Mechanics* (3rd ed.), Ch. 11
(`goldstein-mech`).

## Verification

- Strong invariant: the map's Jacobian determinant is exactly 1
  (area-preserving); at K = 0 the action is conserved and the map is
  exactly invertible; the golden torus is bounded below Greene's
  K_c ~ 0.9716 and diffuses across the cylinder above it; the (pi,0)
  point is an elliptic island for 0 < K < 4; and diffusion is
  blocked below K_c.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
