import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from '../../shared/js/controls/share-state.js';

describe('share-state contract', () => {
  it('round-trips a simple object', () => {
    const s = { a: 1.5, b: 'foo', c: true };
    const enc = encodeState(s);
    const dec = decodeState(enc);
    expect(dec).toEqual(s);
  });
  it('returns null for missing hash', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('#other')).toBeNull();
  });
  it('returns null for malformed payload', () => {
    expect(decodeState('#p=not-base64!')).toBeNull();
  });
  it('URL-safe characters: no + or /', () => {
    // Use a state that produces + and / in standard base64.
    const s = { x: 'a/b+c=', longish: 'this needs padding to test' };
    const enc = encodeState(s);
    expect(enc.includes('+')).toBe(false);
    expect(enc.includes('/')).toBe(false);
    expect(decodeState(enc)).toEqual(s);
  });
  it('numeric precision preserved for floats', () => {
    const s = { x: 0.123456789, y: -1e-10 };
    const dec = decodeState(encodeState(s));
    expect(dec.x).toBe(0.123456789);
    expect(dec.y).toBe(-1e-10);
  });
});
