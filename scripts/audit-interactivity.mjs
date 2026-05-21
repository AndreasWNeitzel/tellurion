#!/usr/bin/env node
// audit-interactivity.mjs
// Catalogue playgrounds that violate the "interactive physics is
// mandatory" rule. A violator has:
//   - NO interactive canvas events (no click/mousedown/pointerdown/
//     mousemove/pointermove/wheel attached to `canvas`),
//   - NO state-evolving step (no `st.t += dt` or `sim.t +=` or any
//     particle/integrator advance call),
// and is therefore at best a parameterised curve plot.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (e === 'playground.js') yield p;
  }
}

const findings = [];
for (const path of walk(ROOT)) {
  let txt;
  try { txt = readFileSync(path, 'utf8'); } catch { continue; }
  // Canvas-targeted pointer events. Match common variants.
  const canvasInteractive =
    /\bcanvas\.addEventListener\(['"](click|mousedown|pointerdown|mousemove|pointermove|wheel|touchstart|touchmove)/.test(txt)
    || /\bstage\.addEventListener\(['"](click|mousedown|pointerdown|mousemove|pointermove|wheel)/.test(txt);
  // State that evolves with time. Cover the many naming variants we
  // use across playgrounds: explicit step functions, accumulator-based
  // physics ticks, particle/MCMC advances.
  const evolvingState =
    /\bstep[A-Z]\w*\s*\(/.test(txt)            // stepCoupled, stepCyclotron, stepRK4, etc.
    || /\btick[A-Z]?\w*\s*\(/.test(txt)        // tick(), tickPhysics, tickSim, tick(now)
    || /\b(advance|integrate)\w*\s*\(/.test(txt)
    || /\b(updateParticles|updateState|updateSim|simStep|physicsTick|physicsStep)\s*\(/.test(txt)
    || /\b(accumulator|elapsed|simTime|simT|t_sim|tsim)\s*\+=/.test(txt)
    || /\b(st|state|sim|s)\.(t|time)\s*\+=/.test(txt)
    || /\bphase\s*\+=/.test(txt)               // many of our slider-paced animations.
    || /\bsweep\w*\s*\(/.test(txt)
    || /\brunMC|\brunMCMC|\bbarnes/i.test(txt);
  // Continuous animation (rAF used in a way that drives state, not just
  // re-render after slider change). Pair rAF with evolvingState below.
  const hasRAF = /requestAnimationFrame\s*\(/.test(txt);
  // Slider-only paradigm: many input listeners, no canvas events, no
  // evolving state. The classic "2D curve plotter" violator.
  if (!canvasInteractive && !evolvingState) {
    const dir = path.slice(ROOT.length + 1, -('/playground.js'.length));
    findings.push({ dir, hasRAF });
  }
}

findings.sort((a, b) => a.dir.localeCompare(b.dir));
console.log(`# Static / curve-plotter playgrounds: ${findings.length}`);
console.log('# (no canvas pointer events, no state-evolving integrator step)');
for (const f of findings) {
  console.log(`  ${f.dir}${f.hasRAF ? '   [has rAF but no state evolution]' : ''}`);
}
