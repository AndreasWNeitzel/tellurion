// sim.js
// Normal modes of a circular drumhead. The wave equation on a disk of radius a,
// separated in polar coordinates, gives modes u_{mn}(r,theta) = J_m(k r) cos(m
// theta) with J_m the Bessel function of the first kind. The clamped rim u(a)=0
// forces J_m(k a) = 0, so the allowed wavenumbers are k_{mn} = j_{m,n}/a, where
// j_{m,n} is the n-th positive zero of J_m, and the frequencies scale as j_{m,n}.
// The (m,n) mode has m nodal diameters and n-1 nodal circles, and the j_{m,n} are
// not integer multiples of each other, so a drum sounds inharmonic.
//
// Reference: Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed.,
// Sec. 14; Kreyszig, Advanced Engineering Mathematics, 10th ed., Sec. 12.10.

// Bessel function of the first kind J_m(x) by its power series (iterative term).
export function besselJ(m, x) {
  if (x === 0) return m === 0 ? 1 : 0;
  const h = x / 2; let t = 1; for (let i = 1; i <= m; i += 1) t *= h / i; // h^m / m!
  let sum = t; const h2 = h * h;
  for (let k = 1; k <= 250; k += 1) { t *= -h2 / (k * (k + m)); sum += t; if (Math.abs(t) < 1e-18 * Math.abs(sum) && k > x) break; }
  return sum;
}

// the n-th positive zero of J_m, by scanning for a sign change and bisecting.
const zeroCache = {};
export function besselZero(m, n) {
  const key = `${m}:${n}`; if (zeroCache[key]) return zeroCache[key];
  let count = 0, prev = besselJ(m, 0.04), dx = 0.02;
  for (let x = 0.06; x < 80; x += dx) {
    const cur = besselJ(m, x);
    if (prev * cur <= 0 && prev !== 0) {
      let a = x - dx, b = x; for (let i = 0; i < 70; i += 1) { const mid = 0.5 * (a + b); if (besselJ(m, a) * besselJ(m, mid) <= 0) b = mid; else a = mid; }
      count += 1; if (count === n) { zeroCache[key] = 0.5 * (a + b); return zeroCache[key]; }
    }
    prev = cur;
  }
  return NaN;
}

// mode shape on the unit disk (a = 1): J_m(k r) cos(m theta), k = j_{m,n}.
export function modeShape(m, n, r, theta) { return besselJ(m, besselZero(m, n) * r) * Math.cos(m * theta); }

// radii of the interior nodal circles (the first n-1 zeros of J_m scaled to r<1).
export function nodalRadii(m, n) { const out = []; const kmn = besselZero(m, n); for (let i = 1; i < n; i += 1) out.push(besselZero(m, i) / kmn); return out; }

export function frequencyRatio(m, n) { return besselZero(m, n) / besselZero(0, 1); }
