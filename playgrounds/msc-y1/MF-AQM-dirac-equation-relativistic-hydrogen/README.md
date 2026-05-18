# Relativistic Hydrogen: Dirac vs Schrodinger, Fine Structure, Zitterbewegung

This playground puts the nonrelativistic Schrodinger hydrogen ladder
next to the exact Dirac-Coulomb spectrum. The top panel draws both: a
blue Schrodinger column at the familiar `-Ry Z^2/n^2` levels and an
amber Dirac column whose levels are deeper and split by the total
angular momentum `j`. An inset zooms the `n=2` multiplet so the fine
structure is visible at any `Z`. The lower-left panel shows
Zitterbewegung, the rapid trembling of a free Dirac particle's
position over its classical drift; the lower-right panel plots the
fine-structure splitting against `Z` on log-log.

Slide `Z` up: at `Z=1` the relativistic correction is a part in
`10^5` and the columns sit on top of each other, but the inset still
resolves the famous `45 micro-eV` `n=2` fine-structure splitting. Push
toward heavy ions and the Dirac `1s` level plunges far below the
Schrodinger value while the splitting grows as `Z^4` (a clean slope-4
line in the log-log panel). The Dirac levels depend only on `n` and
`j`, so `2s1/2` and `2p1/2` stay exactly degenerate (lifting that
degeneracy is the QED Lamb shift, deliberately not included here).
Zitterbewegung trembles at `2 m c^2/hbar` and the drift never reaches
`c`.

`nuclear charge Z` sets the relativistic strength and the
fine-structure scale. `packet momentum p` sets the Zitterbewegung
drift and frequency. Reset returns to `Z=50`, `p=0.6`. Pause/Play
stops or replays the Zitterbewegung time sweep, and Copy URL shares
the exact state. The level and scaling panels read without motion for
`prefers-reduced-motion`.

## Reference

Primary citation: `dirac1928` (the Dirac equation and spectrum); see
also `bjorken-drell1964`, `schrodinger1930` (Zitterbewegung), and
`sakurai2020`.

## Verification

- Strong invariant: the Schrodinger ground state is `-13.6057 eV` to
  0.01%; the Dirac fine-structure splitting scales as `Z^4` and as
  `alpha^4` (`~45 micro-eV` at `n=2, Z=1`); Zitterbewegung at
  `2 m c^2/hbar`.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
