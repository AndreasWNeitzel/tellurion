// sim.js
// Mathematical billiards: a free particle inside a 2D boundary, bouncing
// specularly off the walls. We support three classic geometries:
//   - circle:  fully integrable, Lyapunov = 0
//   - stadium: Bunimovich stadium, chaotic for any straight segment > 0
//   - sinai:   square with a circular disc cut out at the center, chaotic
//
// Reference: Berry 1981 (Eur. J. Phys. 2, 91); Tabachnikov 2005 (Billiards).

const TWO_PI = 2 * Math.PI;

// Reflect velocity v about the inward-pointing normal n (unit vector).
function reflect(vx, vy, nx, ny) {
  const vn = vx * nx + vy * ny;
  return [vx - 2 * vn * nx, vy - 2 * vn * ny];
}

// ===== Circle billiard (radius R = 1) =====================================
function stepCircle(state) {
  // Particle at (x, y) with velocity (vx, vy). Find next intersection with
  // the unit circle moving in the velocity direction, advance to it, reflect.
  const { x, y, vx, vy } = state;
  // |x + t v|^2 = 1 => t^2 (v.v) + 2 t (x.v) + (x.x - 1) = 0
  const a = vx * vx + vy * vy;
  const b = 2 * (x * vx + y * vy);
  const c = x * x + y * y - 1;
  const disc = Math.max(0, b * b - 4 * a * c);
  const t = (-b + Math.sqrt(disc)) / (2 * a);
  const xNext = x + t * vx;
  const yNext = y + t * vy;
  // Outward normal at boundary is (xNext, yNext) (unit since |r|=1).
  // Inward normal is -(xNext, yNext).
  const [vxR, vyR] = reflect(vx, vy, -xNext, -yNext);
  state.x = xNext; state.y = yNext;
  state.vx = vxR; state.vy = vyR;
  state.bounces += 1;
}

// ===== Stadium (Bunimovich) ===============================================
// Stadium with half-width L on each side of two semicircles of radius R = 1.
// Total length = 2 L + 2 R = 2 L + 2. Centered at origin; long axis = x.
// Semicircle centers at (+/- L, 0). Straight walls at y = +/- 1.
const STADIUM_L = 1.0;   // length of each straight segment
function stepStadium(state) {
  const { x, y, vx, vy } = state;
  // Test against four boundary segments, pick the smallest positive t.
  let tMin = Infinity, nx = 0, ny = 0;
  // 1. Right semicircle: (x - L)^2 + y^2 = 1, only solutions with xNext > L.
  // 2. Left semicircle: similar, xNext < -L.
  // 3. Top straight: y = 1, -L <= xNext <= L.
  // 4. Bottom straight: y = -1, same.
  // Right semicircle
  {
    const dx = x - STADIUM_L;
    const a = vx * vx + vy * vy;
    const b = 2 * (dx * vx + y * vy);
    const c = dx * dx + y * y - 1;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const t = (-b + Math.sqrt(disc)) / (2 * a);
      if (t > 1e-9) {
        const xNext = x + t * vx;
        if (xNext >= STADIUM_L && t < tMin) {
          tMin = t;
          // Outward normal at (xNext, yNext) relative to circle center (L, 0).
          const yNext = y + t * vy;
          const r = Math.hypot(xNext - STADIUM_L, yNext);
          nx = -(xNext - STADIUM_L) / r; ny = -yNext / r;
        }
      }
    }
  }
  // Left semicircle
  {
    const dx = x + STADIUM_L;
    const a = vx * vx + vy * vy;
    const b = 2 * (dx * vx + y * vy);
    const c = dx * dx + y * y - 1;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const t = (-b + Math.sqrt(disc)) / (2 * a);
      if (t > 1e-9) {
        const xNext = x + t * vx;
        if (xNext <= -STADIUM_L && t < tMin) {
          tMin = t;
          const yNext = y + t * vy;
          const r = Math.hypot(xNext + STADIUM_L, yNext);
          nx = -(xNext + STADIUM_L) / r; ny = -yNext / r;
        }
      }
    }
  }
  // Top straight y = +1
  if (vy > 0) {
    const t = (1 - y) / vy;
    if (t > 1e-9) {
      const xNext = x + t * vx;
      if (xNext >= -STADIUM_L && xNext <= STADIUM_L && t < tMin) {
        tMin = t; nx = 0; ny = -1;
      }
    }
  }
  if (vy < 0) {
    const t = (-1 - y) / vy;
    if (t > 1e-9) {
      const xNext = x + t * vx;
      if (xNext >= -STADIUM_L && xNext <= STADIUM_L && t < tMin) {
        tMin = t; nx = 0; ny = 1;
      }
    }
  }
  if (!Number.isFinite(tMin) || tMin < 0) return false;
  state.x = x + tMin * vx;
  state.y = y + tMin * vy;
  const [vxR, vyR] = reflect(vx, vy, nx, ny);
  state.vx = vxR; state.vy = vyR;
  state.bounces += 1;
  return true;
}

// ===== Sinai billiard =====================================================
// Square [-1, 1]^2 with a circular hole of radius R_inner = 0.4 at origin.
const SINAI_INNER_R = 0.4;
function stepSinai(state) {
  const { x, y, vx, vy } = state;
  let tMin = Infinity, nx = 0, ny = 0;
  // Inner disc: (x + t vx)^2 + (y + t vy)^2 = R_inner^2. Smaller positive t.
  {
    const a = vx * vx + vy * vy;
    const b = 2 * (x * vx + y * vy);
    const c = x * x + y * y - SINAI_INNER_R * SINAI_INNER_R;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const t1 = (-b - sq) / (2 * a);
      const t2 = (-b + sq) / (2 * a);
      // We're outside the disc; smaller positive root is the entry point.
      let t = t1 > 1e-9 ? t1 : (t2 > 1e-9 ? t2 : Infinity);
      if (t < tMin && t < Infinity) {
        const xNext = x + t * vx, yNext = y + t * vy;
        const r = Math.hypot(xNext, yNext);
        // Outward normal of obstacle (points away from origin); for the
        // particle, the inward normal at this surface points away from origin.
        if (r > 1e-9) {
          tMin = t; nx = xNext / r; ny = yNext / r;
        }
      }
    }
  }
  // Square walls
  if (vx > 0) { const t = (1 - x) / vx; if (t > 1e-9 && t < tMin) { tMin = t; nx = -1; ny = 0; } }
  if (vx < 0) { const t = (-1 - x) / vx; if (t > 1e-9 && t < tMin) { tMin = t; nx = 1; ny = 0; } }
  if (vy > 0) { const t = (1 - y) / vy; if (t > 1e-9 && t < tMin) { tMin = t; nx = 0; ny = -1; } }
  if (vy < 0) { const t = (-1 - y) / vy; if (t > 1e-9 && t < tMin) { tMin = t; nx = 0; ny = 1; } }
  if (!Number.isFinite(tMin)) return false;
  state.x = x + tMin * vx;
  state.y = y + tMin * vy;
  const [vxR, vyR] = reflect(vx, vy, nx, ny);
  state.vx = vxR; state.vy = vyR;
  state.bounces += 1;
  return true;
}

export function createBilliard({ geom = 'stadium', x = 0, y = 0, vx = 1, vy = 0.6 } = {}) {
  const v = Math.hypot(vx, vy);
  return { geom, x, y, vx: vx / v, vy: vy / v, bounces: 0 };
}

export function step(state) {
  if (state.geom === 'circle') return stepCircle(state);
  if (state.geom === 'stadium') return stepStadium(state);
  if (state.geom === 'sinai') return stepSinai(state);
  throw new Error(`unknown geom ${state.geom}`);
}

export const GEOM_BOUNDS = {
  circle:  { xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2 },
  stadium: { xmin: -STADIUM_L - 1.1, xmax: STADIUM_L + 1.1, ymin: -1.1, ymax: 1.1 },
  sinai:   { xmin: -1.1, xmax: 1.1, ymin: -1.1, ymax: 1.1 },
};

export const STADIUM_HALF_LENGTH = STADIUM_L;
export const SINAI_R = SINAI_INNER_R;
