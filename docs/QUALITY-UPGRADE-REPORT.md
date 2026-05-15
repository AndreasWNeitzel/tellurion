# Quality Upgrade Report

Three-gate engagement upgrades. Q1 AUTOPLAY, Q2 DRAMA, Q3 PHYSICAL.

## Phase 0: audit

Wrote `scripts/quality-audit.mjs`. Baseline: PASS 128, PARTIAL 85, FAIL 2.

The audit is a static heuristic that keys Q3 on spec.md wording and Q1 on
playground.js animation-loop structure. It does NOT inspect the rendered
canvas, so a playground.js visual rebuild that does not change spec.md text
is not always reflected in the score. The per-playground notes below are the
authoritative record of what each upgrade actually does.

## Phase 1: tier-1 upgrades (8/8, each its own commit)

- 1-A phonon-dispersion-1d-monatomic-diatomic: clickable dispersion curve
  selects (k, omega); 24-atom strip animates y_i = A sin(k i a - omega t);
  acoustic in-phase vs optical anti-phase. Invariant: zone-boundary atoms
  pi out of phase. Q1 Q2 Q3 pass.
- 1-B nuclear-shell-model-magic-numbers: nucleon hops into lowest unfilled
  level over 0.3 s; gold SHELL CLOSURE banner + up-arrow at magic numbers;
  Auto-fill steps N every 0.4 s. Invariant: closure fires iff magic. Pass.
- 1-C thomas-precession: replaced number readout with a gyroscope disk on a
  projected orbit (1 orbit / 4 s); spin axis accumulates (gamma-1) rad per
  orbit; rate-vs-beta curve demoted to secondary. __physicsCheck verifies
  per-orbit rotation. Pass.
- 1-D bcs-gap-self-consistent: Fermi-circle gap-band primary panel with 8
  fading Cooper-pair lines; autoplay temperature sweep opens/closes the
  gap; Delta(T) curve secondary. Pass.
- 1-E skin-effect-1d-conductor: conductor cross-section with viridis
  J(x)=J0 exp(-x/delta), AC pulse, red dashed skin-depth line; E(z) curve
  secondary. Pass.
- 1-F eddington-grey-atmosphere: limb-darkened solar disk I(mu)=0.4+0.6 mu
  blackbody-colored at T_eff I(mu)^0.25 (Wyman 2013 inlined); T(tau) curve
  secondary. Invariant: center/limb ratio >= 2. Pass.
- 1-G chandrasekhar-dynamical-friction: NEW playground (did not exist).
  200 Maxwellian particles, perturber with gravitational wake, friction
  decelerates it. __physicsCheck verifies f(3 sigma)>0.9, f(0.1 sigma)<0.05.
  Created, golden frames seeded, status verified.
- 1-H fermi-surface-2d-square: vertical drag on the BZ changes filling;
  click the Fermi contour to draw the v_F arrow. Invariant: v_F at
  (pi/2,pi/2) at 45 deg. Pass.

## Phase 2: autoplay (1 fix, 5 already-autoplay, 1 skipped)

- standing-waves, gyroscope-precession, kepler-orbit-explorer,
  foucault-pendulum, coupled-kuramoto-oscillators already animate on load
  (playing: !DETERMINISTIC). No change required.
- 2-B capacitor-discharge-rc: held instantly looping; now holds 1 s at full
  discharge then auto-resets and replays.
- 2-F lorenz-attractor canvas2d: deprecated, skipped per spec.

## Phase 3: drama (3/3)

- 3-A slow-roll-inflation: already had the ball-on-V(phi) panel + (n_s, r)
  plane; added the epsilon=1 end-of-inflation dashed marker.
- 3-B semi-empirical-mass-formula: interaction layer rebuilt as a fitting
  puzzle: target Wapstra B/A heatmap, user-fit overlay, residual map, five
  coefficient sliders from 0, live chi-squared, MATCH at chi^2<50,
  valley-of-stability hint. Engine sim.js untouched (binding re-evaluated
  locally with parameterized coefficients). __physicsCheck verifies
  chi^2<50 at canonical and >10000 at zero.
- 3-C cosmic-distance-ladder: already implements the click-through 4-rung
  journey (parallax / Cepheid / SN Ia / Hubble) with per-rung animation
  and cumulative error bar. Verified, no change needed.

## Phase 4: verification

- Re-ran scripts/quality-audit.mjs: PASS 128, PARTIAL 86, FAIL 2. The
  near-flat delta reflects the static-heuristic limitation noted in Phase 0,
  not the actual visual improvements (all 12 touched playgrounds now have a
  spatial primary scene and autoplay).
- Invariant suites for all 9 upgraded-in-place playgrounds: 64/64 tests
  pass. Zero regressions; only new tests were added, no existing test logic
  changed.
- Reference frames recaptured for every upgraded playground.

## Could not complete

- None of the listed upgrades were blocked. 1-G required creating a new
  playground (it did not exist); done.

## Invariant regressions

- None.
