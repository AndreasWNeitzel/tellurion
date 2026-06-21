# The LR circuit transient

An inductor is the electrical equivalent of inertia: it resists changes in the current flowing through it. Close a switch onto a battery in a series LR circuit and the current does not snap to its final value $V/R$; it climbs there along a smooth exponential, $I(t) = (V/R)(1 - e^{-t/\tau})$, governed by the time constant $\tau = L/R$. The brake is the inductor's back-EMF, $V_L = L\,dI/dt$, which starts out equal to the whole battery voltage and opposes the rising current, then fades to nothing once the current stops changing, so that at every moment the resistor and inductor voltages add up to the battery, $V_R + V_L = V$. While the current builds, the inductor's magnetic field and the energy stored in it, $U = \tfrac12 L I^2$, build with it. The top panel draws the circuit with the current flowing and the field lines growing through the coil; the bottom panel plots the current and the back-EMF against time.

Flip the switch off and the field cannot disappear in an instant either: the current decays as $I_0 e^{-t/\tau}$ and the back-EMF reverses, now driving the current onward as the stored magnetic energy drains out as heat in the resistor. Flip it back on and the whole transient replays, the field lines swelling and the current ramping up the exponential. Raise the inductance or lower the resistance and the time constant $\tau = L/R$ grows, so the current takes longer to settle; watch the green current curve crawl up to the dashed $V/R$ line, reaching about 63 percent of the way there after exactly one time constant while the orange back-EMF curve falls to meet it.

The voltage, inductance, and resistance sliders set the circuit, Flip switch connects or disconnects the battery, and Reset returns to a fresh charge. The current is integrated with an unconditionally stable backward-Euler step, so it stays continuous across the switch and reproduces the textbook exponential.

## Reference

Halliday, Resnick and Walker, *Fundamentals of Physics*, Ch. 30 (RL circuits and energy stored in a magnetic field); Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 7.2 (inductance and the back-EMF).

## Verification

- Strong invariants: the current reaches 0.632 of $V/R$ at one time constant $\tau = L/R$; $V_R + V_L = V$ at every instant; on decay the heat dissipated in the resistor equals the initial stored energy $\tfrac12 L I_0^2$.
- Visual gate: SSIM against committed golden frames at both folds.
