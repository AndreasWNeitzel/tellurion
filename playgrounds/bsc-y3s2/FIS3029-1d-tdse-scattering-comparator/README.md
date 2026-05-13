# 1D TDSE wavepacket scattering

A Gaussian quantum wavepacket moves to the right and hits a barrier. Watch it split into reflected and transmitted parts. Solved via Crank-Nicolson on an 800-point grid; norm conserved to 1e-6 over many hundreds of steps.

What to look for: at low k_0 (slow incoming momentum), the barrier blocks most of the wave; at high k_0 the packet sails through. Square well (V_0 < 0) shows resonant transmission at the bound-state energies. The red curve is |psi|^2; the thin blue is Re psi (carries the phase information).

Controls: potential dropdown, V_0 (height/depth), k_0 (incoming momentum), speed, reset, pause/play.

## Reference

Newman 2013, Computational Physics Ch. 9 Ex. 9.8; Griffiths and Schroeter 2018 QM 3e Sec. 2.5.

## Verification

- Strong invariants: norm conserved to 1e-6 over 300 steps, R + T = 1, group velocity matches k_0, high barrier blocks transmission.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
