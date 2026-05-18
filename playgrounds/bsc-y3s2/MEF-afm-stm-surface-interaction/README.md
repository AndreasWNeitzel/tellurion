# AFM and STM: Tip-Surface Interaction

The two workhorses of nanoscale imaging, side by side. A sharp tip
scans an atomically corrugated surface. In atomic force microscopy
the tip feels the Lennard-Jones interaction
`V(d) = 4 eps [(sig/d)^12 - (sig/d)^6]`: strongly repulsive on
contact, weakly attractive further out, exactly zero force at
`d = 2^{1/6} sigma`. In scanning tunnelling microscopy the tip draws
a current that decays exponentially with the gap,
`I ~ V exp(-2 kappa d)`, `kappa = sqrt(2 m phi)/hbar`; for a metallic
work function (~5 eV) that is roughly a factor of ten in current per
angstrom of gap, which is why STM resolves single atoms. The physics
is the gate-tested closed-form `sim.js`.

What to look for: pick AFM and the middle panel is the Lennard-Jones
force curve, zero at `2^{1/6} sigma`, repulsive then attractive; the
scan trace below modulates with the lattice. Pick STM and the law
panel becomes a straight line on a log axis (pure exponential decay)
labelled with the per-angstrom factor, about `x10` at `phi = 5 eV`.
STM constant-height shows the current swinging strongly atom to atom;
STM constant-current shows the tip-height topograph reproducing the
surface. Drop the work function and the decay flattens (resolution is
lost); raise it and it sharpens.

Controls: the mode selector, the gap/setpoint slider, the
work-function slider, Reset and Pause. Copy URL shares the state.

## Reference

Primary citations: Chen, *Introduction to Scanning Tunneling
Microscopy*, 2nd ed., OUP 2008 (`chen2008`), for the tunnelling
current and the decay constant; Binnig, Quate and Gerber, *Atomic
Force Microscope*, Phys. Rev. Lett. 56 (1986) 930 (`binnig1986`),
for the tip-sample force.

## Verification

- Strong invariants (offline, `sim.js`): the LJ minimum at
  `2^{1/6} sigma` with `V = -eps` and `F = 0`; the exact exponential
  tunnelling law (ratio independent of bias and absolute gap); the
  decade-per-angstrom sensitivity at a metallic work function; the
  constant-current topograph reproducing the corrugation.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic STM constant-current sweep.
- Last verified: see `.verified`.
