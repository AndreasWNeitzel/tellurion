# DEVNOTES - FIS1013-beats-superposition (hidden dev reference)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Two close-frequency cosines y1, y2; their sum with the slow
beat envelope; a spectrum panel with bars at f1, f2. Header shows
carrier f_bar, envelope f_b, audible beat |f1-f2|. Pure local sim.js
(y1,y2,ySum,envelope,envelopeFreq,beatRate,carrierFreq), no shared
engine, no GL.

## Post-build sweep record (2026-05-18) - REAL DEFECT FIXED
- First Opus visual-reviewer: 3/6, FAIL on "frames statically
  identical". Objectively confirmed real (NOT a thumbnail artifact,
  unlike the black-hole/tokamak cases): committed-golden inter-frame
  SSIM was 0.9873..0.9900, t-000 vs t-100 = 0.9995 (essentially
  identical).
- Root cause (read, not guessed): drawAll() plotted y1/y2/sum/envelope
  over a FIXED window t in [0, T_WINDOW] every frame; state.tNow only
  moved a thin vertical cursor + 3 small dots. So ~99.5% of pixels
  (the waveforms) never changed across capture frames; only the
  cursor moved.
- Fix: scroll the time window with state.tNow (oscilloscope). plotFunc
  and both envelope-shadow loops now sample t = state.tNow +
  (i/...)*T_WINDOW; the reference line is fixed at the left edge ("now")
  and the dots/trails sample at t = state.tNow. Removed the now-dead
  tCursor / lastCursor logic. Time-independent of RNG, so capture
  stays deterministic.
- Result: new inter-frame SSIM 0.6744..0.6825 (frames now strongly
  distinct, the beat envelope visibly marches across t-000..t-100).
  Verified by my own screenshot inspection (panel-1 phase relation and
  panel-2 envelope-node positions differ per frame; spectrum static
  and correct: f1=5.0, f2=4.7, beat 0.3 Hz). Visual gate 5/5 x3
  (deterministic vs the recaptured goldens). Second Opus
  visual-reviewer on the new goldens: 6/6 PASS, criterion 4
  ("envelope translates") explicitly PASS.
- Also fixed: placeholder hook/one_paragraph (rendered literally on
  the card) rewritten approachable (piano-tuner analogy, the
  2 cos(f_bar) cos(f_b) identity, scrolling oscilloscope); raw
  "(`crawford-waves`)" key removed from the user-facing figcaption
  (the spec Citations section keeps the `key` cross-ref per repo
  convention); figcaption updated to say "scrolling time window"
  instead of "animated time cursor". Index rebuilt.

## Invariants (invariants.test.mjs)
5 tests on the closed-form beat relations (carrier/envelope/beat-rate
identities, sum reconstruction). All pure-function; the render fix
does not touch them. 5/5.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- recapture (REQUIRED, render changed): node scripts/capture-reference.mjs
  --playground FIS1013-beats-superposition --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
