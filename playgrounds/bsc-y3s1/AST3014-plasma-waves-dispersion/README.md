# Plasma-Wave Dispersion

The omega-k diagram of the basic plasma waves, drawn from their exact
closed-form dispersion relations. The electron plasma frequency
`omega_p = sqrt(n e^2 / eps0 m_e)` sets the scale. The ordinary (O)
mode has a cutoff at `omega = omega_p` and a superluminal phase speed
with `v_phase * v_group = c^2`; the extraordinary (X) mode has the
right and left cutoffs and the upper-hybrid resonance, with an
evanescent stop-band between the resonance and the right cutoff; the
Bohm-Gross Langmuir branch, the saturating ion-acoustic branch, and
the non-dispersive Alfven wave complete the set. A marker sweeps the
selected branch and the inset shows a wave at that point travelling at
the phase speed. The physics is the gate-tested `sim.js`.

What to look for: switch to the O-mode and the curve is flat at
`omega = omega_p` (the cutoff: nothing propagates below it) then bends
up to hug the light line `omega = c k` from above; the readout shows
`v_phase * v_group` staying at `c^2`. The X-mode shows the cutoffs and
the upper-hybrid resonance, with a gap where no real `k` exists (the
stop-band). The Langmuir branch climbs from `omega_p` as the
Bohm-Gross parabola; the ion-acoustic branch is linear then saturates;
the Alfven wave is a straight line. The plasma-frequency slider raises
or lowers the cutoff; the cyclotron-frequency slider moves the X-mode
cutoffs and resonance.

Controls: the mode selector, the omega_p slider, the omega_c slider,
Reset and Pause. Copy URL shares the current state.

## Reference

Primary citations: Stix, *Waves in Plasmas*, AIP 1992 (`stix1992`),
for the cold-plasma O/X modes, cutoffs and resonances; Swanson,
*Plasma Waves*, 2nd ed., IOP 2003 (`swanson2003`), for the
Appleton-Hartree and Bohm-Gross relations; Chen, *Introduction to
Plasma Physics and Controlled Fusion*, 2nd ed., ch. 4 (`chen1984`).

## Verification

- Strong invariants (offline, `sim.js`): the plasma-frequency
  formula; the O-mode cutoff `omega = omega_p` and the identity
  `omega^2 - c^2 k^2 = omega_p^2` with `v_ph v_gr = c^2`; the X-mode
  band structure (propagating below the upper-hybrid resonance and
  above the right cutoff, evanescent between); the Bohm-Gross
  relation; the ion-acoustic limits; the non-dispersive Alfven wave.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic O-mode sweep.
- Last verified: see `.verified`.
