# Eddington grey atmosphere

The temperature in a grey atmosphere in radiative equilibrium follows $T(\tau) = T_\text{eff} (3/4 (\tau + 2/3))^{1/4}$. At the photosphere ($\tau = 2/3$) the temperature equals $T_\text{eff}$; at the boundary ($\tau = 0$) it drops to $T_\text{eff} / \sqrt[4]{2} \approx 0.841 T_\text{eff}$; deep inside it grows as $\tau^{1/4}$.

The Eddington-Barbier limb darkening $I(\mu)/I(1) = 0.4 + 0.6 \mu$ explains why the limb of the Sun is visibly darker than the center.

One slider for $T_\text{eff}$.

## Reference

Primary citation: Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 3 (`hansen-kawaler`).

## Verification

- Strong invariants: $T(2/3) = T_\text{eff}$ exact; $T(0) = T_\text{eff} (1/2)^{1/4}$ exact; limb $I(0)/I(1) = 0.4$ exact.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
