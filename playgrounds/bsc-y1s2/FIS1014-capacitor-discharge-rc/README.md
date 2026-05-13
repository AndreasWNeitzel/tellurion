# RC discharge

A capacitor charged to $V_0$ discharges through a resistor with $V_C(t) = V_0 e^{-t/\tau}$, $\tau = RC$. The current is $I = V_C/R$. After one time constant $V$ is $V_0/e \approx 0.37 V_0$; after five it is below 1 percent. The total energy initially in the capacitor, $\tfrac{1}{2} C V_0^2$, is dissipated as heat in $R$.

Look for the orange charge cloud shrinking with $V$, the $V(t)$ exponential on the right, and the $\tau$ tick mark on the time axis where $V$ crosses $V_0/e$. Changing $R$ or $C$ rescales the time axis without changing the shape.

Three sliders set $V_0$, $R$, and $C$; Reset restarts the clock; Play/Pause toggles time.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 7 (`griffithsem2017`).

## Verification

- Strong invariants: $V(\tau) = V_0/e$ exact; energy conservation $U_C + W_\text{diss} = U_C(0)$ to $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
