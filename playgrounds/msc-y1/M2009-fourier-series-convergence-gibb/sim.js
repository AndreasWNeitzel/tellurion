// Fourier-series convergence and the Gibbs phenomenon on [-pi, pi]
// (Arfken and Weber, Mathematical Methods for Physicists; Gibbs 1899).
// Analytic coefficients for a square, sawtooth and triangle wave, the
// N-term partial sum, the epicycle (rotating-vector) reconstruction,
// the Parseval energy identity and the ~8.95 percent Gibbs overshoot.
// Deterministic, closed form, no RNG.

export const PI = Math.PI;

// Exact target value at x in (-pi, pi). square in [-1,1], sawtooth
// x/pi in [-1,1], triangle 1 - 2|x|/pi in [-1,1].
export function targetVal(kind, x) {
  let t = ((x + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;   // wrap to (-pi, pi]
  if (kind === 'square') return t > 0 ? 1 : (t < 0 ? -1 : 0);
  if (kind === 'sawtooth') return t / PI;
  return 1 - 2 * Math.abs(t) / PI;                          // triangle
}

// Analytic Fourier coefficients up to order N: f ~ a0/2 + sum a_n cos
// + b_n sin. Square: b_n = 4/(n pi) odd. Sawtooth: b_n = 2(-1)^{n+1}/
// (n pi). Triangle: a0 = 0, a_n = -8/(pi^2 n^2) for odd n.
export function coeffs(kind, N) {
  const a = new Float64Array(N + 1), b = new Float64Array(N + 1);
  let a0 = 0;
  for (let n = 1; n <= N; n += 1) {
    if (kind === 'square') b[n] = (n % 2) ? 4 / (n * PI) : 0;
    else if (kind === 'sawtooth') b[n] = 2 * ((n % 2) ? 1 : -1) / (n * PI);
    else a[n] = (n % 2) ? 8 / (PI * PI * n * n) : 0;        // triangle (positive)
  }
  return { a0, a, b, N, kind };
}

// N-term partial sum at x.
export function partialSum(c, x, N = c.N) {
  let s = c.a0 / 2;
  for (let n = 1; n <= N; n += 1) s += c.a[n] * Math.cos(n * x) + c.b[n] * Math.sin(n * x);
  return s;
}

// Complex epicycle coefficients C_k (k = -N..N), f ~ sum C_k e^{i k x}.
// C_0 = a0/2; C_k = (a_k - i b_k)/2; C_{-k} = (a_k + i b_k)/2.
export function epicycleChain(c, x, N = c.N) {
  const pts = [{ x: 0, y: 0 }];
  let X = c.a0 / 2, Y = 0;
  pts[0] = { x: X, y: Y };
  // order by descending |C_k|, alternating +k/-k, for the classic look
  const order = [];
  for (let k = 1; k <= N; k += 1) { order.push(k); order.push(-k); }
  for (const k of order) {
    const ak = c.a[Math.abs(k)], bk = c.b[Math.abs(k)];
    const cre = ak / 2, cim = (k > 0 ? -bk : bk) / 2;
    const ang = k * x;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    X += cre * cos - cim * sin;
    Y += cre * sin + cim * cos;
    pts.push({ x: X, y: Y });
  }
  return pts;                                               // last point: Re = partial sum
}

// Total mean square (1/2pi) integral f^2: square 1, sawtooth 1/3,
// triangle 1/3.
export function meanSquare(kind) {
  if (kind === 'square') return 1;
  return 1 / 3;                                             // sawtooth and triangle
}
// Parseval partial energy a0^2/4 + 1/2 sum (a_n^2 + b_n^2) -> meanSquare.
export function parsevalEnergy(c, N = c.N) {
  let e = (c.a0 / 2) ** 2;
  for (let n = 1; n <= N; n += 1) e += 0.5 * (c.a[n] * c.a[n] + c.b[n] * c.b[n]);
  return e;
}

// Peak of the partial sum just to the right of the x = 0 jump of the
// square wave, and the overshoot as a fraction of the jump (= 2).
export function gibbsOvershoot(N) {
  const c = coeffs('square', N);
  let peak = -Infinity;
  const x1 = 3 * PI / N;                                    // search the first lobe
  for (let i = 1; i <= 600; i += 1) {
    const x = x1 * i / 600;
    peak = Math.max(peak, partialSum(c, x, N));
  }
  return { peak, overshoot: peak - 1, fraction: (peak - 1) / 2 };
}
// Generic overshoot at the actual jump of each target: square jumps
// at x = 0 (right limit +1), sawtooth at x = pi (left limit +1),
// triangle is continuous so there is no jump and no Gibbs.
export function gibbsAtJump(kind, N) {
  if (kind === 'triangle') return null;
  const c = coeffs(kind, N);
  let peak = -Infinity, xAt = 0;
  if (kind === 'square') {
    const x1 = 3 * PI / N;
    for (let i = 1; i <= 600; i += 1) { const x = x1 * i / 600; const v = partialSum(c, x, N); if (v > peak) { peak = v; xAt = x; } }
  } else {                                                  // sawtooth: approach x = pi from below
    const x0 = PI - 3 * PI / N;
    for (let i = 0; i <= 600; i += 1) { const x = x0 + (PI - x0) * i / 600; const v = partialSum(c, x, N); if (v > peak) { peak = v; xAt = x; } }
  }
  return { xAt, peak, frac: (peak - 1) / 2 };               // jump magnitude is 2
}

// The Wilbraham-Gibbs limit: (1/pi) integral_0^pi sinc, fraction of
// the jump that the overshoot tends to.
export function gibbsConstant() {
  let s = 0; const M = 20000;
  for (let i = 1; i <= M; i += 1) {
    const t = PI * i / M;
    s += (Math.sin(t) / t) * (PI / M);
  }
  return s / PI - 0.5;                                      // ~ 0.08949
}
