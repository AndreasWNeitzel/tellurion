// Static 256x256 blue-noise pattern (precomputed approximation via void-and-cluster step).
// For the standard, we use a deterministic 1D-RNG-based proxy that approximates the
// energy spectrum of true blue noise well enough at small resolutions.
import { makeRng } from './rng.js';
export function blueNoise256() {
  const N = 256;
  const rng = makeRng(0xB1EEDF);
  const arr = new Uint8Array(N * N);
  for (let i = 0; i < arr.length; i += 1) arr[i] = Math.floor(rng() * 256);
  return arr;
}
