---
title: Floating-Point Precision Pitfalls
slug: floating-point-precision-pitfalls
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: CC1017
supporting_ucs: [FIS2018]
curriculum_year: bsc-y1s1
primary_citation: newman2013
primary_chapter: 4
hook: 'A 24-bit copy of 0.1 makes a Patriot battery clock drift 0.34 s in 100 h; the range gate walks off the Scud and 28 people die.'
one_paragraph: 'The Patriot missile failure at Dhahran (25 Feb 1991) as a floating-point pitfall you can drive. The fire-control computer counted 0.1 s ticks and multiplied by a 24-bit fixed-point approximation of 0.1; since 0.1 is not exact in binary the clock lost about 9.5e-8 s per tick, never reset, accumulating linearly with uptime. After ~100 h the 0.34 s error times the Scud closing speed displaced the radar range gate by roughly half a kilometre, the track was dropped, no interceptor fired. Drag the uptime and watch the gate walk off the target; toggle the patched software to see the drift vanish. A lower panel shows the exact 24-bit chop and the linear error accumulation.'
tags: [numerics, animation, live-readout, case-study]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Newman, Computational Physics, Revised printing ed., Ch. 4."
---

# Floating-point pitfalls: the Patriot missile failure

## Explainer

### What you are looking at

Computers cannot store most decimal numbers exactly, and a tiny
rounding error, repeated long enough, can kill people. The playground
reconstructs the 1991 Patriot missile failure: a tradeoff hidden in
the binary representation of 0.1 that grew, tick by tick, into a
half-second targeting error and 28 deaths.

### Why 0.1 is not 0.1

Floating-point numbers store a value as
$(-1)^s \times 1.f \times 2^{e}$ with a finite fraction $f$. Just as
$1/3$ has no finite decimal expansion, $0.1$ has no finite binary
one: it is an infinitely repeating binary fraction. Any fixed-width
format must truncate it. The Patriot used a 24-bit fixed-point
constant for 0.1, storing instead

$$\frac{209715}{2097152} = 0.0999999046\ldots,$$

an error of about $9.5\times10^{-8}$ per tick. One tick is harmless;
the disaster is in the accumulation.

### Error accumulation and catastrophic cancellation

System time was kept as an integer count of 0.1 s ticks and converted
to seconds by multiplying by that flawed constant. After running for
$T$ seconds (so $10T$ ticks) the clock drifts by

$$\Delta t \approx 9.5\times10^{-8}\times 10\,T
  \;\propto\; T,$$

growing linearly with uptime. After about 100 hours of continuous
operation the drift reached $\sim0.34$ s. Multiplied by a Scud's
velocity ($\sim1676$ m/s) that is a range-gate error of more than
half a kilometer, so the incoming missile fell outside the tracking
window and was not engaged. The general lessons the playground makes
concrete: representation error is unavoidable, it accumulates with
repeated operations, subtracting nearly-equal numbers (catastrophic
cancellation) destroys precision, and the fix is to bound or reset
accumulated error rather than assume arithmetic is exact.

### Things to try

- Watch the clock drift grow linearly with uptime from a
  $10^{-7}$-scale per-tick error.
- Convert the time drift into a range-gate miss distance and see it
  cross the lethal threshold after ~100 hours.
- Compare exact decimal vs the 24-bit binary constant: the gap that
  started it all.

### Where this comes from

IEEE-754 representation error, accumulation, and catastrophic
cancellation follow Goldberg, "What Every Computer Scientist Should
Know About Floating-Point Arithmetic", ACM Computing Surveys 23, 5
(1991), and the GAO report GAO/IMTEC-92-26 on the Patriot failure.

## Physical setup
Dhahran, 25 February 1991. A Patriot battery's fire-control computer
keeps system time as an integer count of 0.1 s ticks, converted to
seconds by multiplying by a 24-bit fixed-point constant for 0.1.
Because 0.1 has no finite binary representation, the stored constant is
$209715/2097152 = 0.0999999046\ldots$, short of 0.1 by
$\varepsilon \approx 9.5\times10^{-8}$ s per tick. The error is never
reset while the battery is powered, so the clock skews linearly with
uptime. The radar's range gate (the predicted position of a tracked
target on the next sweep) is computed from that clock; a skewed clock
displaces the gate along the target track.

## Governing equations
Accumulated clock error after uptime $T$ hours:
$$\Delta t(T) = \frac{3600\,T}{0.1}\,\varepsilon, \qquad
\varepsilon = 0.1 - \frac{209715}{2097152}.$$
Range-gate displacement for a target closing at speed $v$:
$$\Delta r = v\,\Delta t.$$
At $T = 100$ h, $\Delta t \approx 0.34$ s; with $v \approx 1676$ m/s
(Mach 5 Scud), $\Delta r \approx 0.57$ km. When $\Delta r$ exceeds the
range-gate half-width the track is lost and no interceptor is fired.

This is the same finite-precision family as the secondary `sim.js`
demonstrations kept for the invariants: catastrophic cancellation in
$1 - \cos x = 2\sin^2(x/2)$ and the ill-conditioned quadratic formula.

## Numerical method
Closed-form. The per-tick error is the exact IEEE-754 difference
`0.1 - 209715/2097152`; accumulation is linear in uptime; the
range error is the product with the closing speed. Deterministic, no
RNG. The scene maps metres to pixels at a fixed scale.

## Controls
- `uptime (hours)` 0..100: continuous power-on time.
- `Scud speed (m/s)` 800..2000: closing speed (default 1676).
- `patched software (exact time)`: removes the drift entirely.
- Pause / Play (Scud descent), Reset.

## Expected qualitative features
1. At 0 h the green range gate contains the Scud (TRACKING) and the
   interceptor destroys it.
2. As uptime rises the gate slides up-track behind the Scud.
3. Past the gate half-width the box turns red, TRACK LOST, the Scud
   reaches the barracks (impact burst), no launch.
4. The patched toggle pins the marker at zero error: always tracking.
5. The lower panel shows the exact 24-bit chop and a straight error
   line with 8 h / 20 h / 100 h reference ticks.

## Invariants and acceptance thresholds
| invariant | threshold | location |
| per-tick chop error | $9.5\times10^{-8}<\varepsilon<9.6\times10^{-8}$ s | invariants test |
| error zero at $T=0$, linear in $T$ | exact / rel $<10^{-9}$ | invariants test |
| 100 h clock error | $0.34<\Delta t<0.345$ s | invariants test |
| 100 h range error at Mach 5 | $500<\Delta r<650$ m | invariants test |
| patched removes drift | exactly 0 | invariants test |
| $1-\cos$ and quadratic cancellation | (original 7 tests) | invariants test |
| visual SSIM | $>0.92$ on five deterministic frames | visual test |

All confirmed in `invariants.test.mjs` (12 tests passing).

## Limiting cases for verification
- Patched (exact time): $\Delta t = 0$ for all uptime; always TRACKING.
- $T \to 0$: gate centred on the Scud.
- The 1-cos and quadratic stable forms stay at machine precision (the
  general lesson: never form $a-b$ when $a\approx b$, and never trust a
  constant that the hardware cannot represent).

## Citations
- GAO/IMTEC-92-26, "Patriot Missile Defense: Software Problem Led to
  System Failure at Dhahran" (1992).
- R. Skeel, "Roundoff error and the Patriot missile," SIAM News
  25(4), 1992.
- D. Goldberg, "What every computer scientist should know about
  floating-point arithmetic," ACM Comput. Surv. 23 (1991)
 .
- Newman, *Computational Physics*, Ch. 4.
