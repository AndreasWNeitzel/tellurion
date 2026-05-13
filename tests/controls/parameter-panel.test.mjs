// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from 'vitest';
import { mountParameterPanel } from '../../shared/js/controls/parameter-panel.js';

describe('parameter-panel', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('mount produces a section with a primary grid and a details disclosure', () => {
    const panel = mountParameterPanel(host, { title: 'Test' });
    const section = host.querySelector('section.parameter-panel');
    expect(section).not.toBeNull();
    expect(section.getAttribute('aria-label')).toBe('Test');
    expect(section.querySelector('.parameter-panel-primary')).not.toBeNull();
    expect(section.querySelector('details.parameter-panel-secondary')).not.toBeNull();
    expect(panel.primary).toBeDefined();
    expect(panel.secondary).toBeDefined();
  });

  it('addPrimary places children in the primary grid', () => {
    const panel = mountParameterPanel(host);
    const child = document.createElement('div');
    child.id = 'p-child';
    panel.addPrimary(child);
    expect(host.querySelector('.parameter-panel-primary #p-child')).not.toBeNull();
  });

  it('addSecondary places children inside the disclosure body', () => {
    const panel = mountParameterPanel(host);
    const child = document.createElement('div');
    child.id = 's-child';
    panel.addSecondary(child);
    expect(host.querySelector('.parameter-panel-secondary-body #s-child')).not.toBeNull();
  });
});
