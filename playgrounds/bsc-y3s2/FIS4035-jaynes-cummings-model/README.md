# Jaynes-Cummings Model: Collapse and Revival

This playground shows the exact resonant Jaynes-Cummings dynamics of a
two-level atom (initially excited) coupled to one quantised cavity mode
holding a coherent field of mean photon number `nbar`. Each photon
number `n` drives a Rabi oscillation at `2 g sqrt(n+1)`, so the atomic
inversion is the closed-form sum `W(t) = sum_n P(n) cos(2 g t
sqrt(n+1))`. The top panel draws the full analytic `W(t)`; a bright
sweep with a playhead reveals it in time. The lower panels show the
Poissonian photon distribution `P(n)` and the coherent-field Wigner
function as a Gaussian blob in phase space.

Look at the inversion trace: the fast initial Rabi oscillation dies out
by the marked `collapse t_c` even though the cavity is lossless, then
the signal stays near zero, and then it spontaneously rebuilds into a
revival packet at the marked `revival t_r`. The collapse comes from the
spread of Rabi frequencies in the Poissonian field and its time does
not depend on `nbar`; the revival is a pure interference rephasing and
sits at `t_r = 2 pi sqrt(nbar) / g`. Raising `nbar` pushes the revival
later (as `sqrt(nbar)`) and widens `P(n)`; taking `nbar` to zero gives
the single undamped vacuum Rabi oscillation `cos(2 g t)` with no
collapse.

`mean photons nbar` sets the coherent field (revival time and `P(n)`
width); `coupling g` sets the Rabi and collapse timescales. Reset
restores `nbar = 25`, `g = 1`. Pause/Play stops or resumes the sweep
(Play restarts it once it has reached the end), and Copy URL shares the
exact state. The whole analytic curve is always visible, so the physics
reads without any motion (`prefers-reduced-motion` friendly).

## Reference

Primary citation: `jaynes-cummings1963` (Jaynes and Cummings, Proc.
IEEE 51, 89, 1963); collapse/revival from
`eberly-narozhny-sanchezmondragon1980` (Phys. Rev. Lett. 44, 1323,
1980); see also `gerry-knight2005` Ch. 4.

## Verification

- Strong invariant: probability is conserved (`P_e + P_g = 1`); the
  revival peak is within 10% of `t_r = 2 pi sqrt(nbar)/g` and the
  envelope collapse time is `nbar`-independent to within 1%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
