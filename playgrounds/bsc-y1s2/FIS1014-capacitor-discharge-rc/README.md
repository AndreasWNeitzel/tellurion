# RC discharge

A capacitor charged to $V_0$ discharges through a resistor with $V_C(t) = V_0 e^{-t/\tau}$, $\tau = RC$. The current is $I = V_C/R$. After one time constant $V$ is $V_0/e \approx 0.37 V_0$; after five it is below 1 percent. The total energy initially in the capacitor, $\tfrac{1}{2} C V_0^2$, is dissipated as heat in $R$.

Look for the orange charge cloud shrinking with $V$, the blue charge packets circulating through the loop (fast at first, slowing as the current dies), and the $V(t)$ exponential with the $\tau$ tick where $V$ crosses $V_0/e$. The bottom panel plots the power dissipated in the resistor, $P = I^2 R$: it is largest at $t = 0$ and falls as the current fades, so the resistor is hottest at the start and cools off, exactly as its glow shows. The area swept out under the power curve is the energy delivered as heat (blue, growing); the area still ahead of the cursor is the energy still stored in the capacitor (orange), and the two always sum to the initial store. Changing $R$ or $C$ rescales the time axis without changing the shape.

Three sliders set $V_0$, $R$, and $C$; Reset restarts the clock; Play/Pause toggles time.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 7 (`griffithsem2017`).

## Verification

- Strong invariants: $V(\tau) = V_0/e$ exact; energy conservation $U_C + W_\text{diss} = U_C(0)$ to $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
