---
title: Gravitational-Wave Detector: Inspiral Chirp and Matched Filter
slug: gravitational-wave-detector
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-GR
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: peters1964
hook: 'Two black holes spiral together and the gravitational-wave frequency and amplitude chirp upward; a LIGO arm stretches by 2e-18 m, a thousandth of a proton, and a matched filter pulls the signal out of the noise and reads off the chirp mass to better than 0.1%.'
one_paragraph: 'An interactive compact-binary inspiral and a LIGO-type interferometer (quadrupole / leading post-Newtonian; Peters 1964; Maggiore, Gravitational Waves Vol. 1; Abbott et al. 2016). The chirp mass Mc = (m1 m2)^{3/5}/(m1+m2)^{1/5} sets the frequency evolution df/dt = (96/5) pi^{8/3}(G Mc/c^3)^{5/3} f^{11/3}, so f(tau) ~ tau^{-3/8} sweeps up to merger and the strain amplitude h = (4/D)(G Mc/c^2)^{5/3}(pi f/c)^{2/3} rises with it (about 1e-21 for a 30+30 Msun binary at 400 Mpc, like GW150914). The interferometer panel shows the differential arm response (one 4 km arm +h L/2, the other -h L/2, about 2e-18 m); the waveform panel shows the chirp building to merger; the matched-filter panel correlates the noisy data with a template and peaks sharply at coalescence, recovering the chirp mass. The numerics are the gate-tested sim.js: closed-form inspiral, deterministic (seeded pseudo-noise for the matched filter); the invariants check the chirp-mass formula and its noiseless recovery to 0.1%, the 1e-21 strain at 400 Mpc with the 1/D scaling, the tau^{-3/8} chirp, the opposite-sign sub-proton arm response, and the matched filter peaking at zero lag for the correct template.'
tags: [general-relativity, gravitational-waves, interferometry, signal-processing, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [m1, m2, d]
---

# Gravitational-Wave Detector: Inspiral Chirp and Matched Filter

## Explainer

### What you are looking at

When two black holes spiral together they shake spacetime itself,
sending out a gravitational wave whose frequency sweeps upward into a
"chirp". LIGO digs that chirp out of detector noise with a matched
filter. The playground generates the inspiral waveform and shows how
matched filtering recovers it even when it is buried below the noise.

### The inspiral chirp

As the binary loses energy to gravitational radiation the orbit
shrinks and speeds up, so the wave frequency rises ever faster. To
leading (post-Newtonian) order the frequency evolves as

$$\frac{df}{dt}
  = \frac{96}{5}\,\pi^{8/3}
  \left(\frac{G\mathcal M}{c^3}\right)^{5/3}
  f^{11/3},$$

and the strain amplitude grows as $h\propto f^{2/3}/d$. Everything
depends on one combination of the masses, the chirp mass

$$\mathcal M = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}},$$

so simply timing how fast the chirp sweeps measures $\mathcal M$
directly, and the amplitude gives the distance $d$ (a "standard
siren").

### Matched filtering

The signal is far weaker than the detector noise, so you cannot just
look at it. Matched filtering cross-correlates the data $d(t)$ with a
template $h(t)$ weighted by the noise spectrum $S_n(f)$:

$$\rho^2 \;\propto\;
  \frac{\big|\langle d\,|\,h\rangle\big|^2}
  {\langle h\,|\,h\rangle},
  \qquad
  \langle a|b\rangle
  = 4\,\mathrm{Re}\!\int_0^\infty
  \frac{\tilde a(f)\,\tilde b^*(f)}{S_n(f)}\,df.$$

When the template matches the true waveform the correlation builds up
coherently into a sharp signal-to-noise spike; a wrong template gives
nothing. This is why a buried chirp becomes a confident detection.
The playground sweeps the masses and distance and shows the chirp,
the noisy data, and the matched-filter SNR peak.

### Things to try

- Increase the masses and watch the chirp shorten and sweep up
  faster (larger chirp mass).
- Move the source farther away and watch the strain amplitude drop
  as $1/d$ while the chirp shape is unchanged.
- Compare the matched-filter output for the correct template versus
  a mismatched one: a tall SNR spike versus noise.

### Where this comes from

The inspiral chirp, the chirp mass, and matched filtering follow
Maggiore, *Gravitational Waves, Vol. 1*, Chapters 4 and 7, and the
LIGO discovery paper, Abbott et al., PRL 116, 061102 (2016).

## Physical setup

Two compact objects (black holes / neutron stars) spiral together,
radiating gravitational waves that carry away orbital energy so the
orbit shrinks and the wave frequency and amplitude chirp upward to
merger. A kilometre-scale Michelson interferometer (LIGO) measures the
passing strain as a differential change in its two arm lengths, then a
matched filter extracts the buried signal.

## Governing equations

Quadrupole inspiral (Peters 1964; Maggiore Vol. 1):

```math
M_c = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}}, \qquad
\frac{df}{dt} = \frac{96}{5}\pi^{8/3}
  \Big(\frac{G M_c}{c^3}\Big)^{5/3} f^{11/3},
```

so `f(\tau) = \pi^{-1}(5/256)^{3/8}(G M_c/c^3)^{-5/8}\tau^{-3/8}`
(`\tau = t_{coal}-t`) and
`h(t) = (4/D)(G M_c/c^2)^{5/3}(\pi f/c)^{2/3}\cos\Phi(t)`. The
interferometer responds with `\Delta L_x = +hL/2`,
`\Delta L_y = -hL/2`. The matched-filter SNR is the noise-weighted
correlation of data and template, maximal at the true coalescence
time and template.

## Numerical method

The inspiral is the closed-form leading-PN waveform; the phase is the
trapezoidal integral of `2\pi f`. The matched filter adds deterministic
seeded Gaussian pseudo-noise (LCG + Box-Muller) and correlates with a
unit-norm template over time lags. A sweep plays the inspiral; the
capture path maps capture fraction directly to inspiral time, so
reference frames are reproducible and frame-rate independent.
Deterministic, no live RNG.

## Controls

- `m1`, `m2` (share keys `m1`, `m2`): the component masses (solar
  masses); set the chirp mass and the chirp rate.
- `distance` (share key `d`): luminosity distance (Mpc); the strain
  scales as `1/D`.
- Reset (`30 + 30 Msun`, `400 Mpc`), Pause/Play (the inspiral sweep),
  Copy URL.

## Expected qualitative features

- The waveform chirps: frequency and amplitude rise to merger.
- The interferometer arms move oppositely by `h L / 2 ~ 2e-18 m`
  (a thousandth of a proton), growing toward merger.
- `h ~ 1e-21` for `30+30 Msun` at `400 Mpc`; halving the distance
  doubles the strain.
- The matched-filter SNR has a sharp peak at zero lag for the correct
  template; the recovered chirp mass equals the true value.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. `Mc = (m1 m2)^{3/5}/(m1+m2)^{1/5}`, symmetric, `~26.1 Msun` for
   `30+30`.
2. `Mc` recovered from `(f, df/dt)` to better than 0.1%.
3. Strain `~1e-21` for `30+30 Msun` at `400 Mpc`; `h ~ 1/D`.
4. The frequency chirps: monotone, `f ~ tau^{-3/8}`.
5. The arms respond with opposite sign, sub-proton displacement
   (`|dL| < 1e-15 m`), differential `= h L`.
6. The matched filter peaks at zero lag for the correct template and
   beats a 25% chirp-mass mismatch.
7. The waveform chirps in both frequency and amplitude.
8. Determinism (waveform and matched filter reproducible).

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- Equal mass: `Mc = m\,2^{-1/5}` (test 1).
- `tau -> 0`: `f -> infinity` (merger; truncated just before) (test 4).
- `D -> 2D`: `h -> h/2` (test 3).
- Correct vs mismatched template: SNR ordering (test 6).

## Visual fallback

Static three-panel Canvas2D: the interferometer schematic, the chirp
waveform and the matched-filter SNR are all readable without
animation; only the inspiral playhead sweeps.

## Citations

- Peters, P. C., Phys. Rev. 136, B1224 (1964). `peters1964`.
- Maggiore, M., *Gravitational Waves Vol. 1*. `maggiore-gw`.
- Abbott, B. P. et al., Phys. Rev. Lett. 116, 061102 (2016).
  `abbott-gw150914-2016`.

## Stretch goals

- Higher-PN phase and the merger-ringdown attachment.
- The detector noise PSD and a frequency-domain optimal filter.
- Sky localisation from a two-detector time delay.

## Risk register

- Leading-PN only (no merger/ringdown): the waveform is truncated
  just before the singular `tau -> 0`; the chirp and matched-filter
  recovery are the gate-tested claims.
- The matched-filter "noise" is deterministic seeded pseudo-noise
  (reproducible gates), not a realistic detector PSD: stated; the
  template-ordering invariant is PSD-independent.
- The arm displacement is shown hugely magnified (the true `~2e-18 m`
  is annotated): a visualization choice, not a physical claim.
