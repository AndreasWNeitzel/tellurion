// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountPlayPause } from '../../shared/js/controls/play-pause.js';

describe('play-pause', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('mount produces play and step buttons', () => {
    mountPlayPause(host);
    const buttons = host.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].classList.contains('play-pause')).toBe(true);
    expect(buttons[1].classList.contains('step-once')).toBe(true);
  });

  it('click on play toggles state and emits change', () => {
    const ctrl = mountPlayPause(host);
    const onChange = vi.fn();
    host.addEventListener('change', onChange);
    expect(ctrl.isPlaying()).toBe(false);
    host.querySelector('.play-pause').click();
    expect(ctrl.isPlaying()).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail.state).toBe('playing');
  });

  it('Space toggles play/pause', () => {
    const ctrl = mountPlayPause(host);
    expect(ctrl.isPlaying()).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(ctrl.isPlaying()).toBe(true);
  });

  it('Period key emits step', () => {
    mountPlayPause(host);
    const onStep = vi.fn();
    host.addEventListener('step', onStep);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }));
    expect(onStep).toHaveBeenCalledTimes(1);
  });
});
