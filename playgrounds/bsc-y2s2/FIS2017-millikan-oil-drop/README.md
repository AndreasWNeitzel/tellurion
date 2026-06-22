# The Millikan oil-drop experiment

The charge of a single electron is one of the most fundamental constants in physics, and Robert Millikan measured it in 1909 with an apparatus simple enough to fit on a bench: two horizontal metal plates, a fine spray of oil, and a microscope. The trick is that the droplets pick up a few stray electrons as they are sprayed, so each carries a tiny net charge. The measurement comes in two steps. First, with no voltage on the plates, a drop falls under gravity and almost immediately settles to a slow terminal speed, the point where the air's viscous drag exactly balances the drop's weight. That speed, fed through Stokes' law for drag on a sphere, gives the drop's radius and therefore its mass, even though the drop is far too small to see clearly. The scene shows this when you switch the field off: the drop drifts steadily down.

Then the voltage goes on. The electric force on the drop's charge, $qE$ with $E = V/d$, points up or down depending on the sign, and Millikan tuned it until the drop hung perfectly still in the middle of the gap. At that moment the upward electric force exactly cancels gravity, and the charge falls out of a one-line balance: $q = m'gd/V$. The scene draws the three forces as arrows, gravity down, the electric force up, and drag whenever the drop is moving, and a yellow ring marks the drop when you have it floating. Stepping through the drops gives a different radius and a different charge each time.

The discovery is in the pattern, not any single number, and that is what the lower panel shows. Plot the charge of every drop you measure and the points do not scatter freely: they lock onto a ladder of evenly spaced rungs at $e$, $2e$, $3e$, and so on, with nothing in between. There is a smallest unit of charge, and every drop carries a whole number of them. That smallest unit, $e = 1.602\times10^{-19}$ coulombs, is the charge of a single electron, and its existence is the experimental bedrock of the quantization of charge.

## Reference

Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2nd ed., Wiley, 1985, Ch. 2; Millikan, *Phys. Rev.* **2**, 109 (1913).

## Verification

- Strong invariants: every drop's charge inferred from its balancing voltage is an exact integer multiple of $e$; the terminal velocity is zero at the balancing voltage; the field-off fall speed recovers the drop radius through Stokes' law; the velocity reverses sign across the balance point.
- Visual gate: SSIM against committed golden frames at both folds.

The oil-drop set is an illustrative UI demo (each drop carries an exact integer charge), not measured scientific data.
