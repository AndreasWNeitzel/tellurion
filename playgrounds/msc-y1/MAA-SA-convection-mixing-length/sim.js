// Mixing-length theory: convective flux F_conv = rho cp v_conv DeltaT,
// with v_conv ~ sqrt(g DeltaT alpha l_m / T), where alpha = mixing-length ratio l_m / H_p.
// Schwarzschild criterion: nabla > nabla_ad → convection.
// Reference: Hansen-Kawaler Ch. 5 (`hansen-kawaler`); Kippenhahn-Weigert Ch. 6
// (`kippenhahn-weigert`).
export function vConv(g, DeltaT, T, l_m) {
  return Math.sqrt(Math.max(0, g * DeltaT / T) * l_m);
}
export function FConv(rho, cp, v, DeltaT) { return rho * cp * v * DeltaT; }
export function schwarzschild(nabla, nabla_ad) {
  return nabla > nabla_ad ? 'convective' : 'radiative';
}
export function HpScale(P, rho, g) { return P / (rho * g); }
