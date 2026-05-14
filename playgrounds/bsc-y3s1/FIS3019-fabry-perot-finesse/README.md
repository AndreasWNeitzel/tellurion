# Fabry-Perot etalon: Airy transmission

Two parallel mirrors of reflectance $R$ form a high-Q cavity. Light accumulates round-trip phase $\phi$; the Airy distribution $T = 1/(1 + F \sin^2(\phi/2))$ has sharp resonance peaks at $\phi = 2\pi m$. Finesse $F_* = \pi\sqrt{R}/(1-R)$ measures sharpness; for $R = 0.99$ a typical laser cavity finesse is $F_* \sim 313$.

Look for the dramatic peak sharpening as $R$ climbs past 0.95. The bottom panel zooms onto one peak so you always see the lineshape regardless of finesse.

One slider for the mirror reflectance.

## Reference

Primary citation: Hecht, *Optics*, 5e, Ch. 9 (`hecht2017`).

## Verification

- Strong invariants: $T(0) = 1$ and $T(2\pi) = 1$ exact; $T_\min = 1/(1+F)$ exact; finesse formula $\pi\sqrt{R}/(1-R)$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
