// sim.js
// Line integral of a 2D vector field F = (P, Q) along two paths between
// the same endpoints (A and B). For a conservative field (P_y = Q_x),
// the line integral depends only on the endpoints; for a non-conservative
// field it depends on the path, and the closed loop integral is nonzero.
//
// Field families:
//   conservative1: F = (2 x y, x^2)        (gradient of x^2 y)
//   conservative2: F = (x, y)                (gradient of 0.5 (x^2 + y^2))
//   curl1:         F = (-y, x)               (constant curl = 2)
//   curl2:         F = (-y, x) / (x^2 + y^2) (singular at origin; curl 0 in punctured plane)
//
// Reference: Riley-Hobson-Bence, Mathematical Methods Ch. 10
// (`riley-hobson`).

export const FIELDS = {
  conservative1: { P: (x, y) => 2 * x * y, Q: (x, y) => x * x,
                   label: 'F = (2xy, x^2)', isConservative: true,
                   potential: (x, y) => x * x * y },
  conservative2: { P: (x, y) => x, Q: (x, y) => y,
                   label: 'F = (x, y)', isConservative: true,
                   potential: (x, y) => 0.5 * (x * x + y * y) },
  rotation:      { P: (x, y) => -y, Q: (x, y) => x,
                   label: 'F = (-y, x)', isConservative: false },
  shear:         { P: (x, y) => y, Q: (x, y) => 0,
                   label: 'F = (y, 0)', isConservative: false },
};

// Simpson integration of int_a^b f(t) dt at n subintervals (n even).
function simpson(f, a, b, n) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) {
    s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  }
  return s * h / 3;
}

// Integrate F . dr along a parametric path p(t) = (x(t), y(t)) for t in [0, 1].
export function lineIntegral(field, x, y, dx, dy, n = 200) {
  const f = (t) => field.P(x(t), y(t)) * dx(t) + field.Q(x(t), y(t)) * dy(t);
  return simpson(f, 0, 1, n);
}

// Quadratic Bezier A -> C -> B as a parametric path (for the
// draggable bent path in the UI). Returns x,y,dx,dy closures for
// lineIntegral, so the same Simpson integrator is reused.
export function bezierPath(A, C, B) {
  const bx = (t) => (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * C.x + t * t * B.x;
  const by = (t) => (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * C.y + t * t * B.y;
  const dbx = (t) => 2 * (1 - t) * (C.x - A.x) + 2 * t * (B.x - C.x);
  const dby = (t) => 2 * (1 - t) * (C.y - A.y) + 2 * t * (B.y - C.y);
  return { x: bx, y: by, dx: dbx, dy: dby };
}

// Integral of F . dr along an explicit polyline (array of {x,y}),
// midpoint rule per segment. Used for the live readout while dragging.
export function lineIntegralPolyline(field, pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1], b = pts[i];
    const mx = 0.5 * (a.x + b.x), my = 0.5 * (a.y + b.y);
    s += field.P(mx, my) * (b.x - a.x) + field.Q(mx, my) * (b.y - a.y);
  }
  return s;
}

// Path 1: straight line from A to B.
export function straightPath(A, B) {
  return {
    x: (t) => A.x + (B.x - A.x) * t,
    y: (t) => A.y + (B.y - A.y) * t,
    dx: () => B.x - A.x,
    dy: () => B.y - A.y,
  };
}

// Path 2: semicircle from A to B (above the chord).
export function arcPath(A, B) {
  const cx = 0.5 * (A.x + B.x);
  const cy = 0.5 * (A.y + B.y);
  const r = 0.5 * Math.hypot(B.x - A.x, B.y - A.y);
  const phi0 = Math.atan2(A.y - cy, A.x - cx);
  return {
    x: (t) => cx + r * Math.cos(phi0 - Math.PI * t),
    y: (t) => cy + r * Math.sin(phi0 - Math.PI * t),
    dx: (t) => r * Math.PI * Math.sin(phi0 - Math.PI * t),
    dy: (t) => -r * Math.PI * Math.cos(phi0 - Math.PI * t),
  };
}

// Closed loop integral: A -> B along straight + B -> A along arc reversed
// = closed loop. By Stokes, equals the curl integrated over the enclosed
// area, which is 0 for conservative fields, nonzero otherwise.
export function closedLoopIntegral(fieldName, A, B, n = 200) {
  const field = FIELDS[fieldName];
  const ipS = lineIntegral(field, ...Object.values(straightPath(A, B)).slice(0, 4), n);
  const arcPB = arcPath(A, B);
  const ipA = lineIntegral(
    field,
    (t) => arcPB.x(1 - t),
    (t) => arcPB.y(1 - t),
    (t) => -arcPB.dx(1 - t),
    (t) => -arcPB.dy(1 - t),
    n,
  );
  return ipS + ipA;
}
