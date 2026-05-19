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
one_paragraph: 'An interactive comparison of nonrelativistic and relativistic hydrogen (Dirac 1928; Bjorken and Drell 1964; Schrodinger 1930; Sakurai and Napolitano; Griffiths QM). The Schrodinger levels are E_n = -Ry Z^2/n^2; the exact Dirac-Coulomb (Sommerfeld) levels E_{n,j} = m c^2 [1 + (Z alpha/(n - k + sqrt(k^2 - (Z alpha)^2)))^2]^{-1/2} with k = j + 1/2 depend only on n and j, so 2s1/2 and 2p1/2 are degenerate while 2p3/2 lies above, the fine structure of order (Z alpha)^4 (proportional to alpha^4 and to Z^4). The level panel shows both ladders at true scale (the gross relativistic deepening grows with Z) with an auto-zoomed n=2 fine-structure inset; a second panel shows Zitterbewegung, the Dirac position trembling at angular frequency 2 m c^2 / hbar over the classical drift; a third shows the fine-structure splitting versus Z on log-log (slope 4). The Dirac levels reduce to the Schrodinger ones to order (Z alpha)^2 and lie slightly deeper; the fine-structure splitting scales as Z^4 alpha^4 (about 45 micro-eV at n=2, Z=1), with 2s1/2 and 2p1/2 degenerate and 2p3/2 above, and the Dirac position trembles (Zitterbewegung) at 2 m c^2/hbar over a sub-luminal drift. Reference: Sakurai and Napolitano, Modern Quantum Mechanics, Chapter 8; Bjorken and Drell, Relativistic Quantum Mechanics.'
tags: [quantum-mechanics, relativistic, fine-structure, dirac-equation, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [Z, p]
---

# Relativistic Hydrogen: Dirac vs Schrodinger, Fine Structure, Zitterbewegung

## Explainer

### What you are looking at

Schrodinger's hydrogen levels depend only on $n$. Dirac's relativistic
treatment splits them by total angular momentum $j$ (the fine
structure) and predicts a strange jitter of the electron's position
(Zitterbewegung). The playground stacks the two level ladders, magnifies
the relativistic gap, and shows the trembling, with everything growing
as the nuclear charge $Z$ rises.

### Dirac vs Schrodinger levels

The non-relativistic energy is $E_n^\text{Schr} = -\mathrm{Ry}\,Z^2/n^2$.
Solving the Dirac-Coulomb problem exactly gives levels that depend on
$n$ and $j$:

$$E_{nj}^\text{Dirac}
  = mc^2\Big[1 + \big(\tfrac{Z\alpha}{n - (j+\frac12)
  + \sqrt{(j+\frac12)^2 - (Z\alpha)^2}}\big)^2\Big]^{-1/2}.$$

Expanded for small $Z\alpha$ it reproduces the Schrodinger level plus a
fine-structure correction of order $(Z\alpha)^2$ that splits each $n$
into $j$-sublevels. Because the correction scales as $Z^4$ (the
splitting energy), it is tiny in hydrogen but grows dramatically for
high-$Z$ ions: the playground normalizes by $\mathrm{Ry}\,Z^2$ so the
relativistic deviation is the visible story and a log-log panel shows
the splitting rising with slope 4 in $Z$.

### Zitterbewegung

A Dirac wavepacket built from both positive- and negative-energy
components interferes, producing a rapid trembling of the position
about its classical drift at angular frequency

$$\omega_{ZB} = \frac{2 m c^2}{\hbar} \approx 1.6\times10^{21}\
  \text{s}^{-1},$$

with amplitude of order the Compton wavelength. It is unobservable
directly for a free electron but is the conceptual origin of the
Darwin term in fine structure. The playground animates the trembling
over the smooth drift.

### Things to try

- Raise $Z$ and watch the Dirac levels peel away from the Schrodinger
  ladder (the relativistic deviation growing as $Z^2$, splitting as
  $Z^4$).
- Read the log-log fine-structure panel: a clean slope-4 line in $Z$.
- Watch Zitterbewegung: a fast tremble at $2mc^2/\hbar$ riding the
  classical motion.

### Where this comes from

The Dirac-Coulomb levels, the fine-structure $Z$ scaling, and
Zitterbewegung follow Dirac (1928), Bjorken and Drell, *Relativistic
Quantum Mechanics* (1964), and Sakurai, *Advanced Quantum Mechanics*.

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
