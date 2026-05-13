// parameter-panel.js
// Layout container for grouped controls. Primary controls go directly in the
// panel as a grid; secondary controls live behind a <details> disclosure.

export function mountParameterPanel(container, { title = null } = {}) {
  const panel = document.createElement('section');
  panel.classList.add('parameter-panel');
  panel.setAttribute('role', 'group');
  if (title) panel.setAttribute('aria-label', title);

  // Primary grid: gap and gridTemplate sized off CSS custom properties.
  const primary = document.createElement('div');
  primary.classList.add('parameter-panel-primary');
  primary.style.display = 'grid';
  primary.style.gap = 'var(--space-3)';
  primary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
  panel.appendChild(primary);

  // Secondary disclosure for less-common controls.
  const details = document.createElement('details');
  details.classList.add('parameter-panel-secondary');
  const summary = document.createElement('summary');
  summary.textContent = 'Advanced';
  details.appendChild(summary);
  const secondary = document.createElement('div');
  secondary.classList.add('parameter-panel-secondary-body');
  secondary.style.display = 'grid';
  secondary.style.gap = 'var(--space-3)';
  secondary.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
  details.appendChild(secondary);
  panel.appendChild(details);

  container.appendChild(panel);

  return {
    el: panel,
    primary,
    secondary,
    addPrimary(el)   { primary.appendChild(el); },
    addSecondary(el) { secondary.appendChild(el); },
    destroy() { panel.remove(); },
  };
}
