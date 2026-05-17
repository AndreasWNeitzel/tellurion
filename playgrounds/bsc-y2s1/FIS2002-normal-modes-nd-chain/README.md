# Normal Modes of a Mass-Spring Chain

This playground animates a fixed-end chain of N masses on springs
oscillating in one normal mode, with the dispersion relation drawn
alongside. A monatomic chain has exactly N modes,
`omega_n = 2 sqrt(K/m) sin(n pi / 2(N+1))`, each a standing wave with
`n-1` internal nodes. Make the chain diatomic with two alternating
spring constants and the spectrum splits into an acoustic branch and
an optical branch separated by a band gap.

Watch the chain breathe: it swings from its maximum shape, through a
flat configuration where every mass crosses zero at once, to the
inverted maximum. In the diatomic case the dispersion panel shows the
forbidden gap shaded between the two branches; lower modes are
acoustic (neighbours roughly in phase), higher modes are optical
(neighbours out of phase). Increase the spring ratio K2/K1 and the gap
widens; set it back to 1 and the gap closes, recovering the monatomic
chain. Click anywhere on the dispersion panel to jump to the nearest
mode and branch.

The lattice selector switches monatomic and diatomic; the N slider
sets the chain length; the mode slider sweeps the modes (acoustic then
optical in the diatomic case); the spring-ratio slider sets K2/K1.
Reset returns to a 12-mass diatomic chain and Pause freezes the
motion. The readout reports the lattice, mode, frequency and band gap.

## Reference

Primary citation: Ashcroft and Mermin, *Solid State Physics*, Ch. 22
(`ashcroft-mermin`).

## Verification

- Strong invariant: exactly N analytic monatomic frequencies that the
  Verlet dynamics reproduce within 1%; the diatomic band gap is zero
  to 1e-9 when K1 = K2 and positive otherwise.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
