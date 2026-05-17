# Quantum Gas Statistics Visualizer

This shows how the same N particles in the same box arrange
themselves under the three occupation rules. Maxwell-Boltzmann treats
them as classical and distinguishable; Fermi-Dirac allows one per
state (the Pauli exclusion that fills levels up to the Fermi energy);
Bose-Einstein lets them pile into the same state. The chemical
potential is not a free knob: it is solved at every temperature so
that the occupation integrated over the density of states always
returns exactly N, which is why the N readout never moves off 1.0000.

What to look for: at high temperature the three curves lie on top of
each other, the gas is classical. Cool down and they separate. The
Fermi curve stiffens into a step at the Fermi energy (the dashed blue
line); its value there is exactly one half at any temperature. The
Bose curve climbs at low energy as its chemical potential is pushed
up toward zero. Press Cool through Tc and watch: the moment T crosses
Tc the Bose chemical potential pins at zero and a thick red spike
erupts at zero energy, the condensate, growing as 1-(T/Tc) to the
3/2 power.

Controls: the temperature slider is the one thermodynamic knob; the
statistics selector isolates one rule or overlays all three; the
occupied toggle multiplies by the density of states to show the
spectral occupation g(eps) n(eps) instead of the bare occupation;
Cool through Tc animates a cooling sweep; Reset restores the default.

## Reference

Primary citation: Pathria and Beale, *Statistical Mechanics*
(3rd ed.), Ch. 7-8 (`pathria`); Reif, *Fundamentals of Statistical
and Thermal Physics*, Ch. 9 (`reif`).

## Verification

- Strong invariant: particle number is conserved to better than 1%
  across all temperatures and statistics, including the Bose
  condensate below Tc; the Fermi occupation at the chemical potential
  is exactly 1/2; the off-resonance classical limit and Sommerfeld
  expansion are reproduced.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
