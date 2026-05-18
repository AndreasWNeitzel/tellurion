---
title: Relativistic Hydrogen: Dirac vs Schrodinger, Fine Structure, Zitterbewegung
slug: dirac-equation-relativistic-hydrogen
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-AQM
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: dirac1928
hook: 'The Schrodinger atom has a clean -13.6 Z^2/n^2 ladder; the Dirac equation deepens every level and splits them by total angular momentum j, the fine structure of order (Z alpha)^4. The ground state is -13.6057 eV to better than 0.01% and the n=2 splitting is the exact 45 micro-eV at Z=1, scaling as Z^4.'
one_paragraph: 'An interactive comparison of nonrelativistic and relativistic hydrogen (Dirac 1928; Bjorken and Drell 1964; Schrodinger 1930; Sakurai and Napolitano; Griffiths QM). The Schrodinger levels are E_n = -Ry Z^2/n^2; the exact Dirac-Coulomb (Sommerfeld) levels E_{n,j} = m c^2 [1 + (Z alpha/(n - k + sqrt(k^2 - (Z alpha)^2)))^2]^{-1/2} with k = j + 1/2 depend only on n and j, so 2s1/2 and 2p1/2 are degenerate while 2p3/2 lies above, the fine structure of order (Z alpha)^4 (proportional to alpha^4 and to Z^4). The level panel shows both ladders at true scale (the gross relativistic deepening grows with Z) with an auto-zoomed n=2 fine-structure inset; a second panel shows Zitterbewegung, the Dirac position trembling at angular frequency 2 m c^2 / hbar over the classical drift; a third shows the fine-structure splitting versus Z on log-log (slope 4). The numerics are the gate-tested sim.js: closed-form, deterministic, no RNG; the invariants check the Schrodinger ground state is -13.6057 eV to 0.01% and scales as Z^2/n^2, the Dirac level equals Schrodinger to O((Z alpha)^2) and is slightly deeper, the fine-structure splitting is proportional to Z^4 and to alpha^4 (45 micro-eV at n=2, Z=1), the Dirac (n,j) degeneracy with 2p3/2 above, Zitterbewegung at 2 m c^2/hbar with sub-luminal drift, and determinism.'
tags: [quantum-mechanics, relativistic, fine-structure, dirac-equation, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [Z, p]
---

# Relativistic Hydrogen: Dirac vs Schrodinger, Fine Structure, Zitterbewegung

## Physical setup

A hydrogen-like ion of nuclear charge `Z`. The Schrodinger equation
gives a degenerate `-Ry Z^2/n^2` ladder; the Dirac equation adds the
relativistic kinetic correction, spin-orbit coupling and the Darwin
term, deepening every level and splitting it by the total angular
momentum `j`. A free Dirac wave packet also exhibits Zitterbewegung,
a rapid trembling of its position from positive/negative-energy
interference.

## Governing equations

Schrodinger: `E_n = -Ry Z^2/n^2`, `Ry = (1/2) m c^2 alpha^2`. Exact
Dirac-Coulomb (Sommerfeld) spectrum (Dirac 1928):

```math
E_{n,j} = m c^2\left[1 + \left(\frac{Z\alpha}
  {n - k + \sqrt{k^2 - (Z\alpha)^2}}\right)^2\right]^{-1/2},
\quad k = j + \tfrac12,
```

binding `= E_{n,j} - m c^2`. Expanding, the fine structure enters at
`(Z alpha)^4` (proportional to `alpha^4` and `Z^4`); levels depend
only on `(n, j)`, so `2s1/2 = 2p1/2` and `2p3/2` is higher.
Zitterbewegung (Schrodinger 1930; Bjorken and Drell 1964): the
position expectation trembles at angular frequency
`omega = 2 m c^2 / hbar` (`= 2 E/hbar`) with amplitude of order the
reduced Compton wavelength, over a drift `v_g = p c^2/E`.

## Numerical method

Closed-form Schrodinger and exact Dirac levels (eV). The level panel
normalises by `Ry Z^2` (Schrodinger sits at `-1/n^2` independent of
`Z`) so the relativistic deviation is the visible story; an
auto-scaled inset resolves the tiny `n=2` `j`-splitting at any `Z`.
Zitterbewegung uses the closed-form mixed-packet position (time in
`hbar/m c^2`, length in reduced Compton wavelengths). A time probe
sweeps the Zitterbewegung trajectory; the capture path maps capture
fraction directly to the probe time, so reference frames are
reproducible and frame-rate independent. Deterministic, no RNG.

## Controls

- `nuclear charge Z` (share key `Z`): 1 to 118; sets the relativistic
  strength `Z alpha` and the fine-structure scale (`~ Z^4`).
- `packet momentum p` (share key `p`): the Zitterbewegung drift
  velocity and frequency (`omega = 2 sqrt(1+p^2)`).
- Reset (`Z = 50`, `p = 0.6`), Pause/Play (the Zitterbewegung time
  sweep), Copy URL.

## Expected qualitative features

- Schrodinger ladder at `-1/n^2`; Dirac levels deeper, the shift
  growing strongly with `Z`.
- `2s1/2 = 2p1/2` (same `j`), `2p3/2` above: the fine-structure
  doublet, magnified in the inset.
- `dE_FS(n=2)` is `~45 micro-eV` at `Z=1` and scales as `Z^4`
  (slope 4 on log-log).
- Zitterbewegung: a trembling at `omega = 2` (in `m c^2/hbar`, at
  rest) on a sub-luminal drift.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Schrodinger ground state `= -13.6057 eV` to 0.01%, scales as
   `Z^2/n^2`.
2. Dirac equals Schrodinger to `O((Z alpha)^2)` and is slightly
   deeper (`-13.605874 eV` at `Z=1`).
3. Fine-structure splitting `proportional to Z^4` (ratio 16 per
   doubling); `~45 micro-eV` at `n=2, Z=1`.
4. Fine-structure splitting `proportional to alpha^4`.
5. Dirac levels depend only on `(n, j)`: `2s1/2 = 2p1/2`, `2p3/2`
   above; the exact level matches the `(Z alpha)^2` expansion.
6. Zitterbewegung `omega = 2 m c^2/hbar` at rest (`= 2 sqrt(1+p^2)`),
   `v_g < c`, bounded tremble.
7. Determinism.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `Z alpha -> 0`: Dirac `-> Schrodinger` (test 2).
- `Z` large: strong relativistic deepening, large fine structure
  (tests 2, 3).
- `p = 0`: Zitterbewegung at exactly `2 m c^2/hbar` (test 6).
- `Z alpha -> 1` (`Z ~ 137`): the `1s` level dives toward `-m c^2`
  (the supercritical edge; guarded in the model).

## Visual fallback

Static three-panel Canvas2D: the level diagram and the fine-structure
inset and the log-log scaling read without animation; only the
Zitterbewegung time probe sweeps.

## Citations

- Dirac, P. A. M., Proc. R. Soc. A 117, 610 (1928). `dirac1928`.
- Bjorken, J. D. and Drell, S. D., *Relativistic Quantum Mechanics*,
  1964. `bjorken-drell1964`.
- Schrodinger, E., Sitzungsber. Preuss. Akad. Wiss. 24, 418 (1930).
  `schrodinger1930`.
- Sakurai, J. J. and Napolitano, J., *Modern Quantum Mechanics*.
  `sakurai2020`.

## Stretch goals

- The Lamb shift (QED) lifting the `2s1/2`-`2p1/2` degeneracy.
- Hyperfine structure and the 21 cm line.
- Radial Dirac spinor densities `G(r), F(r)`.

## Risk register

- Supercritical `Z alpha > k` (`Z >~ 137`): `diracLevel` returns NaN
  by design; the slider stops at `Z = 118`, safely below.
- The gross relativistic shift and the tiny `j`-splitting differ by
  orders of magnitude; the design shows the former at true scale and
  the latter in an auto-scaled inset rather than one shared magnified
  axis (which would push high-`Z` levels off-screen).
- Zitterbewegung here is the standard mixed-packet toy (Bjorken and
  Drell 3.3), not a full wave-packet solution; the gate checks the
  frequency, drift and amplitude scale it must satisfy.
