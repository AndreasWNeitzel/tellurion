// 2D Stokes theorem (Green's theorem): for a planar vector field F = (P, Q)
// and a simply connected region R bounded by curve C,
//   oint_C F . dr = iint_R (Q_x - P_y) dA.
// We use F = (-y/2, x/2) so that curl_z = 1 everywhere: circulation = area.
// User can resize a rectangular region with sliders.
export function curlAtPoint(field, x, y) {
  // F = (-y/2, x/2): Q_x = 1/2, P_y = -1/2; curl = Q_x - P_y = 1.
  if (field === 'unit') return 1;
  if (field === 'shear') return -1; // F = (y, 0): curl = -1
  if (field === 'conservative') return 0; // F = (x, y): curl = 0
  return 0;
}
export function circulationRect(field, x0, y0, w, h) {
  // Use the analytic formula: circulation = curl * area for these uniform-curl fields.
  return curlAtPoint(field, 0, 0) * w * h;
}
