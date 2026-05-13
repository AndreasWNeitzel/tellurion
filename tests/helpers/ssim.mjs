// SSIM comparison helper. Lightweight; for higher fidelity use the 'ssim.js' package directly.
// Returns a number in [-1, 1]; 1.0 means identical.

import { PNG } from 'pngjs';
import ssim from 'ssim.js';

export async function compareImagesSSIM(bufA, bufB) {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`Dimension mismatch: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  }
  const { mssim } = ssim.default(
    { data: a.data, width: a.width, height: a.height },
    { data: b.data, width: b.width, height: b.height }
  );
  return mssim;
}
