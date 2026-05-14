// 1D radiative transfer through a uniform slab:
//   dI / d tau = -I + S,
// with constant source function S along the slab. Solution:
//   I_out = I_in exp(-tau) + S (1 - exp(-tau)).
// Reference: Rybicki-Lightman Ch. 1 (`rybickilightman1979`); Carroll-Ostlie Ch. 9
// (`carroll-ostlie`).
export function transmitOptical(I_in, S, tau) {
  return I_in * Math.exp(-tau) + S * (1 - Math.exp(-tau));
}
export function profileVsTau(I_in, S, tauMax, N = 200) {
  const taus = new Float64Array(N + 1), I = new Float64Array(N + 1);
  for (let i = 0; i <= N; i += 1) {
    taus[i] = tauMax * i / N;
    I[i] = transmitOptical(I_in, S, taus[i]);
  }
  return { taus, I };
}
// Resolution: thick slab is independent of I_in: I -> S.
