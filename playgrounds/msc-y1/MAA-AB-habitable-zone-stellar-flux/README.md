# Stellar habitable zone

The habitable zone of a star is the distance range where a planet receives between $1.37\,S_\odot$ and $0.354\,S_\odot$. For the Sun the HZ is approximately 0.85 to 1.68 AU and Earth sits comfortably inside. For an M-dwarf ($T = 3000$ K, $R = 0.3\,R_\odot$) the HZ shrinks to 0.05-0.10 AU (which is why Proxima Centauri b at 0.05 AU is a candidate habitable world).

Look for the green annulus. Sliders set the star's $T_\text{eff}$, radius, and the test-planet distance. The planet marker turns green when in the HZ and red when not.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7 (`carroll-ostlie`).

## Verification

- Strong invariants: $L_\star = 4\pi R^2 \sigma T^4$ within 1 percent; Sun HZ 0.85-1.68 AU; Earth in HZ; M-dwarf HZ shrinks.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
