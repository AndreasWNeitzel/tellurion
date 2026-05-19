import { describe, it, expect } from 'vitest';
import { u_v, d_v, gluon, sea, sampleX, partonShape } from './sim.js';
function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
describe('parton-distribution-toy', () => {
  it('u_v integrates to 2', () => {
    let s = 0; const N = 1000;
    for (let i = 0; i < N; i += 1) s += u_v((i + 0.5) / N);
    expect(Math.abs(s / N - 2)).toBeLessThan(0.05);
  });
  it('d_v integrates to 1', () => {
    let s = 0; const N = 1000;
    for (let i = 0; i < N; i += 1) s += d_v((i + 0.5) / N);
    expect(Math.abs(s / N - 1)).toBeLessThan(0.05);
  });
  it('gluon dominates at small x', () => {
    expect(gluon(0.01)).toBeGreaterThan(u_v(0.01) + d_v(0.01));
  });
  it('valence peaks ~ 0.1-0.3', () => {
    expect(u_v(0.1) + u_v(0.2) + u_v(0.3)).toBeGreaterThan(u_v(0.7) + u_v(0.8) + u_v(0.9));
  });
  it('sea is small at large x', () => {
    expect(sea(0.5)).toBeLessThan(sea(0.05));
  });
  it('sampleX stays in (0,1) and partonShape matches the named PDFs', () => {
    const r = lcg(0xC0FFEE);
    for (const k of ['u', 'd', 'g', 's']) {
      for (let i = 0; i < 200; i += 1) { const x = sampleX(k, r); expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(1); }
    }
    expect(partonShape('u', 0.3)).toBe(u_v(0.3));
    expect(partonShape('g', 0.02)).toBe(gluon(0.02));
  });
  it('sampled mean-x ordering: valence > gluon > sea (valence at moderate x)', () => {
    const mean = (k) => { const r = lcg(0x1234 + k.charCodeAt(0)); let s = 0; const N = 4000; for (let i = 0; i < N; i += 1) s += sampleX(k, r); return s / N; };
    const mu = mean('u'), mg = mean('g'), ms = mean('s');
    expect(mu).toBeGreaterThan(mg);
    expect(mg).toBeGreaterThan(ms);
    expect(mu).toBeGreaterThan(0.12);
    expect(ms).toBeLessThan(0.12);
  });
});
