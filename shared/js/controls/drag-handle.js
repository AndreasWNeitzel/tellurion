// drag-handle.js
// Draggable 2D point on a Canvas/SVG figure. The caller passes a
// pixelToData(px, py) -> {x, y} function and an initial data position. The
// control emits CustomEvent('change', { detail: { x, y } }) in data
// coordinates on every drag step.
//
// Mouse, touch, and keyboard are all supported via Pointer Events:
//   pointerdown/move/up handles the drag.
//   Arrow keys move by 1 px in pixel space; Shift+Arrow moves by 10 px.

export function mountDragHandle(parent, {
  x = 0, y = 0,
  pixelToData = (px, py) => ({ x: px, y: py }),
  dataToPixel = (dx, dy) => ({ px: dx, py: dy }),
  radius = 8,
  label = 'drag handle',
} = {}) {
  const el = document.createElement('div');
  el.classList.add('drag-handle');
  el.setAttribute('role', 'application');
  el.setAttribute('aria-label', label);
  el.setAttribute('tabindex', '0');
  el.style.position = 'absolute';
  el.style.width  = `${2 * radius}px`;
  el.style.height = `${2 * radius}px`;
  el.style.borderRadius = '50%';
  el.style.transform = 'translate(-50%, -50%)';
  parent.appendChild(el);

  let dataX = x, dataY = y;
  position();

  function position() {
    const p = dataToPixel(dataX, dataY);
    el.style.left = `${p.px}px`;
    el.style.top  = `${p.py}px`;
  }

  function setData(nx, ny, sourceDetail = {}) {
    dataX = nx;
    dataY = ny;
    position();
    el.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      detail: Object.assign({ x: dataX, y: dataY }, sourceDetail),
    }));
  }

  function setPixel(px, py, sourceDetail = {}) {
    const d = pixelToData(px, py);
    setData(d.x, d.y, sourceDetail);
  }

  function rectPos(e) {
    const rect = parent.getBoundingClientRect();
    return { px: e.clientX - rect.left, py: e.clientY - rect.top };
  }

  let dragging = false;
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    el.setPointerCapture?.(e.pointerId);
    setPixel(...Object.values(rectPos(e)).slice(0, 2), { pointer: true });
    e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = rectPos(e);
    setPixel(p.px, p.py, { pointer: true });
  });
  el.addEventListener('pointerup',     () => { dragging = false; });
  el.addEventListener('pointercancel', () => { dragging = false; });

  el.addEventListener('keydown', (e) => {
    let dpx = 0, dpy = 0;
    if (e.key === 'ArrowRight') dpx = +1;
    if (e.key === 'ArrowLeft')  dpx = -1;
    if (e.key === 'ArrowUp')    dpy = -1;
    if (e.key === 'ArrowDown')  dpy = +1;
    if (dpx === 0 && dpy === 0) return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const p = dataToPixel(dataX, dataY);
    setPixel(p.px + dpx * step, p.py + dpy * step, { keyboard: true });
  });

  return {
    el,
    get position() { return { x: dataX, y: dataY }; },
    setData,
    destroy() { el.remove(); },
  };
}
