// Thin wrapper around the shared pseudo-spectral KdV engine for the
// soliton-canal-3d hero. The renderer (playground.js + the GL engine)
// only ever consumes this headless integrator; the same exports are
// exercised by invariants.test.mjs, so a fake animation cannot pass.
export {
  makeKdV, addSoliton, setGaussian, clear, step, invariants, peak,
  fftInPlace,
} from '../../../shared/js/engine/kdv-1d-spectral-cpu.js';
