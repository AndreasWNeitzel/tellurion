# Coupled pendulums and normal modes

Two identical pendulums coupled by a spring at distance $d$ from the pivot oscillate in two normal modes: symmetric ($\omega_+ = \sqrt{g/L}$) and antisymmetric ($\omega_- = \sqrt{g/L + 2 k d^2 / m L^2}$). The asymmetric initial condition (one displaced, the other at rest) decomposes into both modes and produces beating: energy moves between the two pendulums with period $T_\text{beat} = 2\pi / (\omega_- - \omega_+)$.

Look for the classic beating pattern when you click "Asymmetric IC": pendulum 1 starts large and pendulum 2 starts at zero; after one quarter of the beat period pendulum 2 is matching pendulum 1; after a half beat almost all the amplitude is on pendulum 2. Click "Symmetric IC" or "Antisym IC" to lock into a single mode where no beating occurs.

Two sliders set the coupling strength $k$ and the attachment ratio $d/L$. Three buttons reinitialize with canonical initial conditions.

## Reference

Primary citation: French, *Vibrations and Waves* (MIT Introductory Physics), Ch. 5 (`french-waves`).

## Verification

- Strong invariants: $\omega_\pm$ exact; symmetric and antisymmetric modes preserve their structure; energy conservation $10^{-6}$ over 10 s.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
