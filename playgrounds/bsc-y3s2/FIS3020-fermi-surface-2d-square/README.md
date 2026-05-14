# Fermi surface on a 2D square lattice

A tight-binding electron on a square lattice has dispersion $E = -2t (\cos k_x + \cos k_y)$. At low filling the Fermi surface is a Fermi circle near $\Gamma$; at half-filling it is the perfectly nested diagonal of the Brillouin zone (van Hove singularity in DOS); at high filling it shifts to closed loops near $M = (\pi, \pi)$.

Look for the DOS van Hove peak at $E = 0$ at half-filling. The yellow occupied region in the BZ panel grows from a small disk to fill the entire zone minus the corners.

One slider for the filling fraction $f$.

## Reference

Primary citation: Ashcroft-Mermin, *Solid State Physics*, Ch. 8 (`ashcroft-mermin`).

## Verification

- Strong invariants: band edges $\pm 4t$ exact; half-filling $E_F \approx 0$; DOS sums to total grid points.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
