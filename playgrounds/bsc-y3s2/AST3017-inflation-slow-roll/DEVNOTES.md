# DEVNOTES - AST3017-inflation-slow-roll (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. (n_s, r) plane with four inflation-model tracks (phi2,
phi4, natural, starobinsky) and the Planck 2018 box; an operating dot
moves along the highlighted track as N (e-folds) varies. Closed-form.

## Post-build sweep (2026-05-18) - REAL physics bug + capture bug fixed
Driven by the chunk-4 deep audit (which flagged the n_s error) plus
my own first-principles re-derivation (the deep agent's phi4 number
was itself wrong; I verified the correct closed form independently).

1. SCIENTIFIC: slow-roll n_s was wrong. For V ~ phi^p with N e-folds:
   eps = p/(4N), eta = (p-1)/(2N)  =>  n_s = 1 - 6eps + 2eta
   = 1 - (p+2)/(2N), r = 16 eps = 4p/N.
   sim.js had `1 - 4/(2N) - 2/N` (= 1-4/N) for phi2 and
   `1 - 6/(2N) - 2/N` (= 1-5/N) for phi4: a spurious extra -2/N.
   Correct: phi2 -> 1-2/N (r 8/N), phi4 -> 1-3/N (r 16/N). The code's
   OWN comment (line ~16) already stated the correct 1-(n+2)/(2N);
   the code deviated from it. Fixed sim.js phi2/phi4; cleaned the
   natural-inflation dead code (a `* 0` no-op + unused var) keeping
   the standard large-f form 1 - 2/N - 1/f^2. Fixed spec.md lines
   33-34 (were 1-4/N, 1-5/N) and the index.html figcaption.
   STRENGTHENED invariants: added exact-closed-form assertions
   (phi2 n_s=1-2/N r=8/N; phi4 n_s=1-3/N r=16/N at N=50/60/100), so
   this regression is now pinned. invariants 10/10.
2. CAPTURE: recapture showed t-075 == t-100 (SSIM 1.000). bootSync
   used model = models[floor(frac*4)] over 4 models / 5 frames, so
   frac .75 and 1.0 both clamped to starobinsky -> two pixel-
   identical goldens. Fixed: i = round(frac*4) in [0,4];
   model = models[i % 4]; N = 40 + 10*i (full slider range), so the
   5 frames are (phi2,40)(phi4,50)(natural,60)(starobinsky,70)
   (phi2,80) - all distinct (i=0 vs i=4 same model but opposite
   ends of the track). Post-fix inter-frame SSIM 0.986/0.993/0.995/
   0.989, no duplicates. Verified by my own t-000/t-075/t-100
   inspection: tracks now at correct n_s, Planck box rendered, 5
   frames distinct.
3. PRESENTABILITY: placeholder hook/one_paragraph rewritten
   approachable; raw mukhanov-cosmology key removed from figcaption.

Render changed -> goldens recaptured, visual gate 5/5 x3, .verified
refreshed with the real results (this card was already shipped;
kept shipped legitimately, NOT via the heartbeat fast-ship bypass).

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs  (10 tests, incl. closed-form pins)
- recapture (REQUIRED, render changed): node scripts/capture-reference.mjs
  --playground AST3017-inflation-slow-roll --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs ; then write .verified ONLY after gates pass

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict BROKEN was FULLY STALE (pre-fix). Current sim.js is correct: phi2 {ns:1-2/N, r:8/N}, phi4 {ns:1-3/N, r:16/N}, Starobinsky {1-2/N, 12/N^2} = canonical n_s=1-(p+2)/(2N), r=4p/N. The REVIEW`s own recommended phi4 fix (1-4/N) was itself WRONG (correct is 1-3/N, matching MAA-CO-slow-roll-inflation). invariants.test.mjs 10/10 pass testing the correct closed forms; hook/one_paragraph are real prose (not STATUS placeholders); no raw bib key in index.html; leakscan2=0; has ## Explainer; .verified. No code or text change required. Verified-clean.
