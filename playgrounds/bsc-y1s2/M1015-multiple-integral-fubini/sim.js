// Fubini: for f continuous on R = [a,b] x [c,d], the iterated integrals
// agree:  int_a^b int_c^d f dy dx = int_c^d int_a^b f dx dy.
// We demo with f(x, y) = sin(x) cos(y) on [0, pi] x [0, pi].
const F = (x, y) => Math.sin(x) * Math.cos(y);
function simp(f, a, b, N) {
  const h = (b - a) / N; let s = f(a) + f(b);
  for (let i = 1; i < N; i += 1) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return s * h / 3;
}
export function dxDy(N = 200, A = 0, B = Math.PI, C = 0, D = Math.PI) {
  return simp((x) => simp((y) => F(x, y), C, D, N), A, B, N);
}
export function dyDx(N = 200, A = 0, B = Math.PI, C = 0, D = Math.PI) {
  return simp((y) => simp((x) => F(x, y), A, B, N), C, D, N);
}
export function exact(A = 0, B = Math.PI, C = 0, D = Math.PI) {
  // int F = (cos A - cos B)(sin D - sin C).
  return (Math.cos(A) - Math.cos(B)) * (Math.sin(D) - Math.sin(C));
}

// The two inner integrals, exposed so the UI can draw the iterated
// profiles. innerX(y) = int_0^A F(x,y) dx ; innerY(x) = int_0^B F dy.
// Integrating innerX over y (or innerY over x) recovers the double
// integral, which is the Fubini statement made visible.
export function innerX(y, A = Math.PI, N = 120) {
  return simp((x) => F(x, y), 0, A, N);
}
export function innerY(x, B = Math.PI, N = 120) {
  return simp((y) => F(x, y), 0, B, N);
}
export function fAt(x, y) { return F(x, y); }
