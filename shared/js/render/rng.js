// Deterministic seeded PRNGs. Math.random is forbidden in this project; use these.
// mulberry32 has period 2^32; sufficient for short runs. xoshiro128** for serious work.

// mulberry32: returns a function () => float in [0, 1).
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// xoshiro128** with 128-bit state. Period 2^128 - 1, passes BigCrush.
export function xoshiro128ss(seedA, seedB, seedC, seedD) {
  let a = seedA | 0, b = seedB | 0, c = seedC | 0, d = seedD | 0;
  return function () {
    const t = b << 9;
    let r = Math.imul(b, 5);
    r = (r << 7 | r >>> 25) | 0;
    r = Math.imul(r, 9);
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11 | d >>> 21) | 0;
    return (r >>> 0) / 4294967296;
  };
}

// Box-Muller standard normal from a uniform RNG.
export function gaussian(rng = mulberry32(0xC0FFEE), mean = 0, sigma = 1) {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = rng();
  u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  return mean + sigma * r * Math.cos(2 * Math.PI * u2);
}

// Splitmix32 used to derive multiple independent streams from a single seed.
export function splitmix32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x9E3779B9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85EBCA6B);
    z = Math.imul(z ^ (z >>> 13), 0xC2B2AE35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export function makeRng(seed = 0xC0FFEE) {
  const sm = splitmix32(seed);
  return xoshiro128ss(sm(), sm(), sm(), sm());
}

export const DEFAULT_SEED = 0xC0FFEE;
