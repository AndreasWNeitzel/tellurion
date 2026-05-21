import { readFileSync, writeFileSync } from 'node:fs';

const DIRS = [
  'bsc-y1s1/FIS1013-coupled-pendulums-normal-modes',
  'bsc-y1s1/FIS1013-coupled-springs-normal-modes',
  'bsc-y1s1/FIS1013-pendulum-on-moving-cart',
  'bsc-y1s1/FIS1013-central-force-orbit-gallery',
  'bsc-y1s1/FIS1013-rigid-body-euler-3d',
  'bsc-y1s1/FIS1013-tennis-racket-theorem',
];

// Match the block the first codemod inserted and capture the energy call.
const BLOCK = /\/\/ A conservative \(Hamiltonian\) system: total energy is the\n\/\/ invariant\. The baseline is captured on the first call\.\nlet __energy0 = null;\nif \(!window\.playground\.getInvariants\) \{\n  window\.playground\.getInvariants = function \(\) \{\n    try \{\n      const E = (.+?);\n[\s\S]*?\n  \};\n\}/;

let done = 0;
for (const dir of DIRS) {
  const p = `playgrounds/${dir}/playground.js`;
  let src = readFileSync(p, 'utf8');
  const m = src.match(BLOCK);
  if (!m) { console.log(`SKIP ${dir}: block not found`); continue; }
  const call = m[1];
  const repl = `// A conservative (Hamiltonian) system: total energy is the
// invariant. The baseline is the energy at the start of the run and
// is re-taken whenever a control change steps the energy.
let __energy0 = null, __energyPrev = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const E = ${call};
      if (!Number.isFinite(E)) return [];
      if (__energyPrev !== null
        && Math.abs(E - __energyPrev) > 0.02 * Math.max(1e-9, Math.abs(__energyPrev)) + 1e-9) {
        __energy0 = E;                    // discontinuity: a control changed the system
      }
      __energyPrev = E;
      if (__energy0 === null) __energy0 = E;
      const dE = Math.abs(E - __energy0) / Math.max(1e-12, Math.abs(__energy0));
      return [{
        key: 'energy',
        label: 'total energy conserved (rel. drift)',
        value: dE.toExponential(2),
        status: dE < 1e-3 ? 'pass' : (dE < 1e-2 ? 'pending' : 'drift'),
      }];
    } catch (e) { return []; }
  };
}`;
  src = src.replace(BLOCK, repl);
  writeFileSync(p, src);
  done += 1;
  console.log(`OK ${dir} -> ${call}`);
}
console.log(`re-baselining wired in ${done} playgrounds`);
