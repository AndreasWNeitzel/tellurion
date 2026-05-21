// Unit tests for the canvas typography module (Layout System v2).
import { describe, it, expect } from 'vitest';
import {
  fontSize, fontString, setCanvasFont, textWithMargin,
  onCanvasResize, COLORS, _ROLES, _REF_WIDTH,
} from './canvas-type.js';

// Minimal canvas stub: only the fields the module reads.
function mockCanvas(cssWidth, { width, height, plotRole } = {}) {
  return {
    clientWidth: cssWidth,
    clientHeight: cssWidth,
    width: width ?? cssWidth,
    height: height ?? cssWidth,
    dataset: plotRole ? { plotRole } : {},
  };
}

describe('fontSize', () => {
  it('returns the base size at the 600 px reference width', () => {
    for (const [role, r] of Object.entries(_ROLES)) {
      const s = fontSize(mockCanvas(_REF_WIDTH), role);
      // base may itself be clamped, but at reference width size == base
      // unless base sits outside [min,max] (it never does in the table).
      expect(s).toBeCloseTo(r.base, 6);
    }
  });

  it('scales with sqrt(width / 600)', () => {
    // At 4x the reference width, sqrt factor is 2.
    const c = mockCanvas(2400);
    // body: base 13 -> 26, clamped to max 17.
    expect(fontSize(c, 'body')).toBe(17);
    // title: base 18 -> 36, clamped to max 24.
    expect(fontSize(c, 'title')).toBe(24);
  });

  it('clamps to the role minimum on tiny canvases', () => {
    const c = mockCanvas(100);
    for (const [role, r] of Object.entries(_ROLES)) {
      expect(fontSize(c, role)).toBe(r.min);
    }
  });

  it('never returns below the role minimum or above the maximum', () => {
    for (const w of [50, 200, 600, 900, 1280, 4000]) {
      const c = mockCanvas(w);
      for (const [role, r] of Object.entries(_ROLES)) {
        const s = fontSize(c, role);
        expect(s).toBeGreaterThanOrEqual(r.min);
        expect(s).toBeLessThanOrEqual(r.max);
      }
    }
  });

  it('applies diagnostic-canvas floors', () => {
    // A narrow diagnostic canvas would otherwise clamp tick to min 10.
    const diag = mockCanvas(100, { plotRole: 'diagnostic' });
    expect(fontSize(diag, 'tick')).toBe(11);
    expect(fontSize(diag, 'caption')).toBe(12);
    expect(fontSize(diag, 'heading')).toBe(13);
    // A non-floored role is unaffected by the diagnostic flag.
    expect(fontSize(diag, 'badge')).toBe(_ROLES.badge.min);
  });

  it('throws on an unknown role', () => {
    expect(() => fontSize(mockCanvas(600), 'nonsense')).toThrow(/unknown role/);
  });

  it('falls back to the reference width when the canvas is unlaid-out', () => {
    const c = { clientWidth: 0, width: 0, dataset: {} };
    expect(fontSize(c, 'body')).toBe(_ROLES.body.base);
  });
});

describe('fontString', () => {
  it('produces a valid ctx.font string with weight, px size and family', () => {
    const s = fontString(mockCanvas(600), 'body');
    expect(s).toMatch(/^400 13\.0px /);
  });

  it('honours weight and the mono family', () => {
    const s = fontString(mockCanvas(600), 'mono', 'mono', 600);
    expect(s).toMatch(/^600 12\.0px /);
    expect(s.toLowerCase()).toMatch(/mono/);
  });

  it('carries no role name and no literal token reference', () => {
    const s = fontString(mockCanvas(900), 'tick');
    expect(s).not.toContain('var(');
  });
});

describe('setCanvasFont', () => {
  it('sets font, baseline, optional color and align on the context', () => {
    const ctx = {};
    setCanvasFont(ctx, mockCanvas(600), 'caption', { color: '#abc', align: 'center' });
    expect(ctx.font).toMatch(/12\.0px/);
    expect(ctx.fillStyle).toBe('#abc');
    expect(ctx.textBaseline).toBe('alphabetic');
    expect(ctx.textAlign).toBe('center');
  });
});

describe('textWithMargin', () => {
  it('insets top-left text by fontSize * 0.8 from the near edges', () => {
    const calls = [];
    const ctx = { fillText: (s, x, y) => calls.push({ s, x, y }) };
    const c = mockCanvas(600, { width: 600, height: 400 });
    textWithMargin(ctx, c, 'hi', 'caption', 'top-left');
    const pad = fontSize(c, 'caption') * 0.8;
    expect(calls.length).toBe(1);
    expect(calls[0].x).toBeCloseTo(pad, 6);
    expect(calls[0].y).toBeCloseTo(pad, 6);
    expect(ctx.textAlign).toBe('left');
    expect(ctx.textBaseline).toBe('top');
  });

  it('places bottom-right text inset from both far edges', () => {
    const calls = [];
    const ctx = { fillText: (s, x, y) => calls.push({ s, x, y }) };
    const c = mockCanvas(600, { width: 600, height: 400 });
    textWithMargin(ctx, c, 'hi', 'tick', 'bottom-right');
    const pad = fontSize(c, 'tick') * 0.8;
    expect(calls[0].x).toBeCloseTo(600 - pad, 6);
    expect(calls[0].y).toBeCloseTo(400 - pad, 6);
    expect(ctx.textAlign).toBe('right');
    expect(ctx.textBaseline).toBe('bottom');
  });

  it('throws on an unknown anchor', () => {
    const ctx = { fillText: () => {} };
    expect(() => textWithMargin(ctx, mockCanvas(600), 'x', 'tick', 'middle'))
      .toThrow(/unknown anchor/);
  });
});

describe('onCanvasResize', () => {
  it('returns a no-op unsubscribe when ResizeObserver is absent', () => {
    // jsdom-free test environment has no ResizeObserver.
    const unsub = onCanvasResize(mockCanvas(600), () => {});
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});

describe('COLORS', () => {
  it('exposes primary, secondary and dimmed color strings', () => {
    expect(typeof COLORS.primary).toBe('string');
    expect(typeof COLORS.secondary).toBe('string');
    expect(typeof COLORS.dimmed).toBe('string');
  });
});
