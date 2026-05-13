// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountThemeToggle } from '../../shared/js/controls/theme-toggle.js';

describe('theme-toggle', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('mount uses the stored theme if any, else system', () => {
    window.localStorage.setItem('portfolio-theme', 'dark');
    const ctrl = mountThemeToggle(host);
    expect(ctrl.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('click cycles system -> light -> dark -> system', () => {
    const ctrl = mountThemeToggle(host);
    expect(ctrl.theme).toBe('system');
    host.querySelector('button').click();
    expect(ctrl.theme).toBe('light');
    host.querySelector('button').click();
    expect(ctrl.theme).toBe('dark');
    host.querySelector('button').click();
    expect(ctrl.theme).toBe('system');
  });

  it('persists to localStorage under portfolio-theme', () => {
    mountThemeToggle(host);
    host.querySelector('button').click();
    expect(window.localStorage.getItem('portfolio-theme')).toBe('light');
  });

  it('emits change event with theme detail', () => {
    mountThemeToggle(host);
    const onChange = vi.fn();
    host.addEventListener('change', onChange);
    host.querySelector('button').click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail.theme).toBe('light');
  });
});
