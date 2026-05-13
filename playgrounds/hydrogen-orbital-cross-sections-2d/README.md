# Hydrogen orbitals in the (x, z) plane

The probability density |psi_nlm|^2 for hydrogen-atom eigenstates, sliced through the plane containing the nucleus and the z axis. You can see the radial nodes (concentric rings) and angular lobes (s, p, d, f) at once.

What to look for: 1s is a single Gaussian-like blob. 2s shows a node between an inner sphere and an outer shell. 2p_z has a dumbbell along z. 3d_z2 has the classic "doughnut around z" structure with two axial lobes. The span slider lets you zoom in on the structure; gamma makes the faint outer rings visible.

Controls: orbital dropdown picks (n, l, m); span sets the displayed box half-width in Bohr radii; gamma controls intensity scaling on the heatmap.

## Reference

Griffiths and Schroeter 2018, QM 3e, Section 4.2; Sakurai and Napolitano 2017, Modern QM 3e, Section 3.6.

## Verification

- Strong invariants: radial normalization, ground-state value at origin = 1/pi, node count = n - l - 1, spherical-harmonic normalization, 2p_z dumbbell along z.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
