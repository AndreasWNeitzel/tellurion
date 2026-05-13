// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountResetButton } from '../../shared/js/controls/reset-button.js';

describe('reset-button', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('mount produces a button child', () => {
    mountResetButton(host);
    const btn = host.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Reset');
  });

  it('click fires a reset event', () => {
    mountResetButton(host);
    const onReset = vi.fn();
    host.addEventListener('reset', onReset);
    host.querySelector('button').click();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onReset.mock.calls[0][0].detail.source).toBe('reset-button');
  });

  it('R key fires the reset event', () => {
    mountResetButton(host);
    const onReset = vi.fn();
    host.addEventListener('reset', onReset);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('R key inside a text input does NOT fire reset', () => {
    mountResetButton(host);
    const input = document.createElement('input');
    document.body.appendChild(input);
    const onReset = vi.fn();
    host.addEventListener('reset', onReset);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    expect(onReset).not.toHaveBeenCalled();
  });
});
