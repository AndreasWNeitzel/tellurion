# Displacement current

Charge a capacitor through a resistor and current flows in the wires, but it stops at the plates: no charge crosses the gap. A compass held near the gap still deflects, so a magnetic field circulates there as though a current were passing through. Maxwell's fix was to add a term to Ampere's law, the displacement current $I_\text{disp} = \varepsilon_0\, d\Phi_E/dt$, a changing electric flux that acts like a current. Because the field between the plates is $E = Q/(\varepsilon_0 A)$, the displacement current works out to $dQ/dt$, exactly the conduction current in the wire, so the total current is continuous and Ampere's law gives the same $B$ on a loop around the wire or around the gap. The top panel charges the capacitor with conduction current in the wires and a growing field in the gap; the bottom panel plots the two currents against time.

Slide the Amperian loop (the orange dashed ellipse) from a wire into the gap and watch the enclosed current readout: it does not change, because the displacement current in the gap exactly replaces the conduction current in the wire. In the bottom plot the conduction current (cyan) and the displacement current (dashed green) sit on top of each other at every instant, both decaying as $e^{-t/RC}$, while the gap field (gold) rises toward its steady value. Raise the resistance or the capacitance and the time constant $RC$ grows, so the charging and the current decay both slow down. This is the term that completes Maxwell's equations and lets a changing electric field source a magnetic one, the mechanism behind electromagnetic waves.

The resistance and capacitance sliders set the charging time constant; the loop slider moves the Amperian loop along the axis; Recharge relaunches from zero charge and Pause freezes the animation. The displacement current is computed independently from the rate of change of the electric flux, so its agreement with the conduction current is a result, not an assumption.

## Reference

Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 7.3 (the displacement current); Halliday, Resnick and Walker, *Fundamentals of Physics*, Ch. 32 (Maxwell's equations).

## Verification

- Strong invariant: the displacement current $\varepsilon_0\, d\Phi_E/dt$, computed independently of the wire current, equals the conduction current at every instant, so $B$ is the same at the wire and at the gap.
- Visual gate: SSIM against committed golden frames at both folds.
