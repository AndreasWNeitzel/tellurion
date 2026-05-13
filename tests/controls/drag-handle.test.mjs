// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountDragHandle } from '../../shared/js/controls/drag-handle.js';

describe('drag-handle', () => {
  let parent;
  beforeEach(() => {
    document.body.innerHTML = '';
    parent = document.createElement('div');
    parent.style.position = 'relative';
    parent.style.width  = '400px';
    parent.style.height = '300px';
    document.body.appendChild(parent);
  });

  it('mount creates an application-role element at the initial pixel position', () => {
    mountDragHandle(parent, {
      x: 1.0, y: 2.0,
      pixelToData: (px, py) => ({ x: px / 100, y: py / 100 }),
      dataToPixel: (dx, dy) => ({ px: dx * 100, py: dy * 100 }),
      label: 'handle',
    });
    const el = parent.querySelector('.drag-handle');
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('application');
    expect(el.getAttribute('aria-label')).toBe('handle');
    expect(el.style.left).toBe('100px');
    expect(el.style.top).toBe('200px');
  });

  it('setData updates position and emits change with the new data coords', () => {
    const ctrl = mountDragHandle(parent, {
      x: 0, y: 0,
      pixelToData: (px, py) => ({ x: px, y: py }),
      dataToPixel: (dx, dy) => ({ px: dx, py: dy }),
    });
    const onChange = vi.fn();
    ctrl.el.addEventListener('change', onChange);
    ctrl.setData(7, 11);
    expect(ctrl.position).toEqual({ x: 7, y: 11 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toMatchObject({ x: 7, y: 11 });
  });

  it('Arrow keys move 1 px (Shift = 10 px) and emit change', () => {
    const ctrl = mountDragHandle(parent, {
      x: 100, y: 100,
      pixelToData: (px, py) => ({ x: px, y: py }),
      dataToPixel: (dx, dy) => ({ px: dx, py: dy }),
    });
    const onChange = vi.fn();
    ctrl.el.addEventListener('change', onChange);
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(ctrl.position).toEqual({ x: 101, y: 100 });
    ctrl.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
    expect(ctrl.position).toEqual({ x: 101, y: 110 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
