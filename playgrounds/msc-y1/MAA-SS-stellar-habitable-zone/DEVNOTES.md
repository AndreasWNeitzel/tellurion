# DEVNOTES - msc-y1/MAA-SS-stellar-habitable-zone (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX) was GENUINE on both points (HEAVY): (1) invariants.test.mjs was the skeleton energy-drift MOCK (no sim.js); (2) frozen capture -> all 5 goldens identical. Physics (T_eq Stefan-Boltzmann balance, HZ bounds) was correct. Fixed: extracted DOM-free sim.js (luminosity/Teq/radiusAtT/hzBounds/inHZ), playground.js imports it (removed inline duplicate + unused rng import); added CAPTURE_FRAC sweeping the planet a from 0.30 to 3.0 AU (slider synced); wrote 9 real invariants (L=R^2(Teff/Tsun)^4, Earth T_eq~254 K, T_eq~1/sqrt(a), (1-A)^1/4, HZ edges exactly at 273/200 K, HZ ~ sqrt(L), inHZ consistency, determinism) all pass. Recaptured 5 distinct goldens; READ t-000 (a=0.30 AU T_eq=464 K hot/red, inside HZ inner) and t-050 (a=1.65 AU T_eq=198 K cold/blue, past HZ outer; HZ=[0.87,1.62] AU exact) physically correct, 60fps. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  9 passed + visual 5/5 x3. Shipped.

## Live-fix 2026-05-19
User: "clear downgrade, no circular orbit, sliders choppy/broken, planet goes out of view, ALL sliders affect distance, misleading". Root causes (all render-side; sim.js physics correct, Earth T_eq check passes): (1) no animation loop at all -> frozen; (2) habitable zone drawn as a horizontal rectangle with the planet on a straight line, not an orbit -> "no circular orbit", misleading; (3) the AU->px scale was (W-160)/(r_out*1.4), coupled to the HZ outer radius, so Teff/R/albedo all rescaled the planet pixel position and flung it off-screen -> "all sliders affect distance, planet out of view". Rebuilt the render as a top-down orbital view: star at centre coloured by Teff, habitable zone as a green annulus (r_in..r_out), faint AU reference rings, the planet on a circular orbit with Keplerian angular speed (omega ~ a^-3/2), coloured by equilibrium temperature (red too-hot / green habitable / blue too-cold) with a compact bottom-left HUD. Stable scale Rmax=max(3, a*1.18, r_out*1.08) so sliders change the physics (HZ size, T_eq) and the planet is always on screen. Added a real rAF animation loop; deterministic capture sweeps a 0.30->3.0 AU and the orbit phase for 5 distinct frames. sim.js and invariants byte-identical (9/9). Verified live: planet visibly orbits A->B, HZ annulus correct, nothing escapes. Also fixed scripts/smoke-load.mjs: it sampled only the top-left 48x48 corner (false BROKEN on centred content); now scans the whole canvas and flags blank only if <1% deviates from the background.
invariants 9/9, smoke OK, visual 5/5 x3.
