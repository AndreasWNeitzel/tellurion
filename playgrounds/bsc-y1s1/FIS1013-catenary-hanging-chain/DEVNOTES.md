# DEVNOTES - FIS1013-catenary-hanging-chain (hidden dev reference)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. A suspension-bridge catenary: two draggable towers, a
fixed-length main cable solved through both supports
(solveCatenary2pt), vertical hangers, a deck. Gold cable. Readout:
a, cable length L, span, sag, T_max. Pure local sim.js
(tension, solveCatenary2pt, sampleCatenary2pt, catenary2ptY); the
symmetric y = a cosh(x/a) - a API is retained for the invariant
tests. No shared engine, no GL.

## Post-build sweep record (2026-05-18) - SPEC/IMPL DIVERGENCE FIXED
- Opus visual-reviewer: 5/6, "missing orange dashed parabola overlay"
  called BLOCKING. Investigated rather than blindly trusting:
  * spec.md line 82 + README promised "Catenary (cyan), parabolic
    approximation (orange dashed), chain beads, tangent arrows" and
    pegs at (+-1, 0).
  * playground.js has NO parabola / setLineDash / cyan / beads /
    tangent-arrow code. grep confirms it draws a gold cable + towers
    + deck + hangers + readout.
  * Conclusion: the playground was REWORKED from the old
    pegs-and-parabola design into a draggable suspension bridge; the
    spec/README/page-description still described the OLD design. The
    "missing parabola" is a spec-over-promise, not a render bug. The
    render itself is correct (reviewer PASS on all 5 other criteria;
    my own t-050 inspection: clean cosh cable, towers, hangers, deck,
    readout a=1.158 L=4.76 span=3.40 sag=1.489 T_max~11.36).
- Fix chosen (truthful, low-risk, in-scope, same pattern as the lorenz
  sweep): make the TEXT match the actual implementation rather than
  bolt a mismatched symmetric parabola onto an asymmetric draggable
  bridge. Rewrote spec.md (placeholder hook/one_paragraph + Physical
  setup + Numerical method + Controls + Expected features + Visual
  fallback + Risk), README.md, and the index.html "What you are
  seeing" description + figcaption. Removed the false orange-dashed /
  cyan / pegs-at-(+-1) claims and the raw `lemos-analytical` key from
  the user-facing caption. The parabola is kept ONLY as the
  shallow-cable mathematical limit (invariant 5), explicitly noted as
  not a drawn curve. RENDER-NEUTRAL: no playground.js change, goldens
  valid, NO recapture / visual-gate rerun.
- Invariants 7/7 (closed-form symmetric API, unaffected). Index
  rebuilt.

## Invariants (invariants.test.mjs)
7 tests: y(0)=0; y=a cosh(x/a)-a; arc length a sinh(x/a); slope
sinh(x/a); parabola limit a=50 within 1% (math limit, not drawn);
tension linear in height; sampled curve length and y>=0. All pure.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (7 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only; the
  render was already correct, the spec over-promised a feature).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
