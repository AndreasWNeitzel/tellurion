import { readFileSync, writeFileSync } from 'node:fs';

// [dir, energy-fn name, state argument] for conservative (Hamiltonian)
// playgrounds whose sim.js already exports the energy function.
const TARGETS = [
  ['bsc-y1s1/FIS1013-coupled-pendulums-normal-modes', 'energy', 'sim'],
  ['bsc-y1s1/FIS1013-coupled-springs-normal-modes', 'totalEnergy', 'state.sim'],
  ['bsc-y1s1/FIS1013-pendulum-on-moving-cart', 'energy', 'state.sim'],
  ['bsc-y1s1/FIS1013-central-force-orbit-gallery', 'energy', 'orbit'],
  ['bsc-y1s1/FIS1013-rigid-body-euler-3d', 'energy', 'body'],
  ['bsc-y1s1/FIS1013-tennis-racket-theorem', 'energy', 'st.sim'],
];

const GENERIC = `if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}`;

let done = 0;
for (const [dir, fn, arg] of TARGETS) {
  const p = `playgrounds/${dir}/playground.js`;
  let src = readFileSync(p, 'utf8');
  if (!src.includes(GENERIC)) { console.log(`SKIP ${dir}: generic block not found`); continue; }
  const repl = `// A conservative (Hamiltonian) system: total energy is the
// invariant. The baseline is captured on the first call.
let __energy0 = null;
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const E = ${fn}(${arg});
      if (!Number.isFinite(E)) return [];
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
  src = src.replace(GENERIC, repl);
  writeFileSync(p, src);
  done += 1;
  console.log(`OK ${dir} -> ${fn}(${arg})`);
}
console.log(`wired energy invariant in ${done} playgrounds`);
