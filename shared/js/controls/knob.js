// knob.js
// Rotary scalar input. Linear or log scale. Keyboard arrows step by 1 percent
// of range; shift+arrow steps by 10 percent. ARIA role="slider" so screen
// readers get aria-valuenow / valuemin / valuemax. Pointer drag rotates the
// indicator within +/- 135 degrees, mapping the angle to the value.
//
// Emits CustomEvent('change', { detail: { value } }).

export function mountKnob(container, {
  min = 0, max = 1, value = 0.5, step = null, scale = 'linear',
  label = '',
} = {}) {
  if (scale !== 'linear' && scale !== 'log') {
    throw new Error(`knob: unknown scale ${scale}`);
  }
  if (scale === 'log' && (min <= 0 || max <= 0)) {
    throw new Error('knob: log scale requires min > 0 and max > 0');
  }

  let v = clamp(value, min, max);
  const stepSize = step ?? (max - min) / 100;     // 1 percent default

  const el = document.createElement('div');
  el.classList.add('knob');
  el.setAttribute('role', 'slider');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', label || 'knob');
  setAria();

  const dot = document.createElement('span');
  dot.classList.add('knob-indicator');
  el.appendChild(dot);
  positionDot();

  const text = document.createElement('span');
  text.classList.add('knob-value');
  text.textContent = format(v);
  el.appendChild(text);

  container.appendChild(el);

  function tValue() {
    if (scale === 'log') {
      const lo = Math.log(min), hi = Math.log(max);
      return (Math.log(v) - lo) / (hi - lo);
    }
    return (v - min) / (max - min);
  }
  function fromT(t) {
    t = clamp(t, 0, 1);
    if (scale === 'log') {
      const lo = Math.log(min), hi = Math.log(max);
      return Math.exp(lo + t * (hi - lo));
    }
    return min + t * (max - min);
  }
  function setAria() {
    el.setAttribute('aria-valuemin', String(min));
    el.setAttribute('aria-valuemax', String(max));
    el.setAttribute('aria-valuenow', String(v));
  }
  function positionDot() {
    const t = tValue();
    const angle = -135 + 270 * t;        // sweep from -135 deg to +135 deg
    dot.style.transform = `rotate(${angle}deg)`;
  }
  function format(x) {
    return Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(3);
  }

  function set(newValue, sourceDetail = {}) {
    const next = clamp(newValue, min, max);
    if (next === v) return;
    v = next;
    setAria();
    positionDot();
    text.textContent = format(v);
    el.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      detail: Object.assign({ value: v }, sourceDetail),
    }));
  }

  function nudge(direction, fraction) {
    if (scale === 'log') {
      const lo = Math.log(min), hi = Math.log(max);
      const dt = direction * fraction;
      const t  = clamp(tValue() + dt, 0, 1);
      set(fromT(t), { keyboard: true });
    } else {
      const range = max - min;
      const delta = direction * range * fraction;
      set(v + delta, { keyboard: true });
    }
  }

  el.addEventListener('keydown', (e) => {
    let dir = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   dir = +1;
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') dir = -1;
    if (dir === 0) return;
    e.preventDefault();
    const fraction = e.shiftKey ? 0.10 : 0.01;
    nudge(dir, fraction);
  });

  // Pointer drag: vertical drag updates the value (1 px = stepSize).
  let dragStart = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    el.setPointerCapture?.(e.pointerId);
    dragStart = { y: e.clientY, value: v };
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragStart) return;
    const dy = dragStart.y - e.clientY;             // up increases
    const range = max - min;
    set(dragStart.value + dy * (range / 200));      // 200 px = full range
  });
  el.addEventListener('pointerup', () => { dragStart = null; });
  el.addEventListener('pointercancel', () => { dragStart = null; });

  return {
    el,
    get value() { return v; },
    set(value) { set(value); },
    destroy() { el.remove(); },
  };
}

function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
