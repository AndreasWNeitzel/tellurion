// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountKnob } from '../../shared/js/controls/knob.js';

describe('knob', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('mount produces a slider-role element with ARIA values', () => {
    mountKnob(host, { min: 0, max: 10, value: 3, label: 'gain' });
    const el = host.querySelector('.knob');
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('10');
    expect(el.getAttribute('aria-valuenow')).toBe('3');
    expect(el.getAttribute('aria-label')).toBe('gain');
  });

  it('ArrowRight nudges by 1 percent of range and emits change', () => {
    const ctrl = mountKnob(host, { min: 0, max: 100, value: 50 });
    const onChange = vi.fn();
    ctrl.el.addEventListener('change', onChange);
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(ctrl.value).toBeCloseTo(51, 6);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail.value).toBeCloseTo(51, 6);
  });

  it('Shift+ArrowRight nudges by 10 percent of range', () => {
    const ctrl = mountKnob(host, { min: 0, max: 100, value: 50 });
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    expect(ctrl.value).toBeCloseTo(60, 6);
  });

  it('ArrowDown decreases value', () => {
    const ctrl = mountKnob(host, { min: 0, max: 100, value: 50 });
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(ctrl.value).toBeCloseTo(49, 6);
  });

  it('clamps to [min, max]', () => {
    const ctrl = mountKnob(host, { min: 0, max: 10, value: 9.95 });
    ctrl.set(50);
    expect(ctrl.value).toBe(10);
    ctrl.set(-5);
    expect(ctrl.value).toBe(0);
  });

  it('log scale uses geometric steps', () => {
    const ctrl = mountKnob(host, { min: 1, max: 100, value: 10, scale: 'log' });
    // At log midpoint: log(10) is exactly halfway between log(1) and log(100).
    // ArrowRight by 1 percent of t should still keep the value within (1, 100).
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(ctrl.value).toBeGreaterThan(10);
    expect(ctrl.value).toBeLessThan(100);
  });
});
