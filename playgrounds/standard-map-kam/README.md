# Chirikov standard map and KAM-torus breakdown

The simplest area-preserving discrete map: kick a rotator periodically, plot where its phase point lands on each kick. At K = 0 the map is integrable (every horizontal line is invariant). The KAM theorem says irrational tori survive small K; the most irrational one (golden-mean winding number) is the most robust and breaks last, at K_crit = 0.971635 (Greene 1979).

What to look for: drag K from 0 toward 1 and watch invariant lines develop bulges, island chains, and (just past K_crit) thin chaotic layers. Past K = 2 the chaos is the rule and large-scale diffusion in p is possible. Click on the plot to seed a new orbit at that point.

The K slider sets the kick amplitude. n/orbit controls how long each orbit is. Snap-to-K_crit jumps straight to the Greene-1979 critical value.

## Reference

Chirikov 1979, Physics Reports 52, 263; Greene 1979, J. Math. Phys. 20, 1183.

## Verification

- Strong invariants: K = 0 conserves p to 1e-12, Lyapunov in (0.0, 0.0 + 0.05) regular vs > 0.4 chaotic, orbit fills > 30/64 bins at K = 2.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
