// model.js
// Shared galaxy-merger model: constants and the two-galaxy builder, used
// by BOTH the Web Worker (live 60fps path) and the synchronous
// deterministic capture path (the SSIM gate). Single source of truth, so
// the worker and the gate integrate exactly the same physics.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

export const G     = 1;
export const THETA = 1.0;          // Barnes-Hut opening angle (Barnes & Hut 1986)
export const EPS   = 0.045;        // Plummer softening
export const NTOT  = 3000;         // largest N at solid 60fps per-frame
                                   // for the faithful cuspy 3D model
export const DT    = 0.025;
const ZH    = 0.12;                // stellar-disk scale height
const PITCH = 0.35;                // spiral arm pitch
const HALO_TRUNC = 5;              // Hernquist halo truncation (in scale a)

// KIND: 0 primary disk, 1 companion stars, 2 primary halo, 3 companion halo.
// Builds two galaxies; the companion approaches at the angle of attack to
// the PRIMARY disk plane (z=0): aoa 0 edge-on, 90 face-on, between
// inclined. Returns Float64/Uint8 typed arrays.
export function buildGalaxies(state, seed) {
  const rng = makeRng(seed);
  const M1 = state.M1, M2 = state.M2, Mt = M1 + M2;
  let n1 = Math.round(NTOT * M1 / Mt);
  n1 = Math.max(800, Math.min(NTOT - 800, n1));
  const n2 = NTOT - n1;
  const nd1 = Math.round(0.22 * n1), nh1 = n1 - nd1;
  const nd2 = Math.round(0.22 * n2), nh2 = n2 - nd2;
  const Rd1 = 0.7, Rd2 = 0.5 * Math.sqrt(M2 / M1);
  const A1 = 2.2 * Rd1, A2 = 2.2 * Rd2;
  const sep = 2.6, b = state.impact;
  const aoaR = state.aoa * Math.PI / 180;
  const dax = Math.cos(aoaR), daz = Math.sin(aoaR);
  const c1 = { x: -(sep / 2) * dax, y: -b / 2, z: -(sep / 2) * daz };
  const c2 = { x: +(sep / 2) * dax, y: +b / 2, z: +(sep / 2) * daz };

  const NP = n1 + n2;
  const X = new Float64Array(3 * NP);
  const V = new Float64Array(3 * NP);
  const M = new Float64Array(NP);
  const KIND = new Uint8Array(NP);
  const ORIG = new Uint8Array(NP);

  const dirS = () => {
    const u = 2 * rng() - 1, ph = 2 * Math.PI * rng(), s = Math.sqrt(1 - u * u);
    return [s * Math.cos(ph), s * Math.sin(ph), u];
  };
  const hern = (a) => {
    const q = rng();
    let r = a * Math.sqrt(q) / Math.max(1 - Math.sqrt(q), 1e-3);
    if (r > HALO_TRUNC * a) r = HALO_TRUNC * a * rng();
    return r;
  };
  let k = 0;
  function place(c, nd, nh, Rd, ha, orig, spiral) {
    for (let i = 0; i < nd; i += 1) {
      if (spiral) {
        let R = -Rd * Math.log(1 - rng());
        if (R > 3.4 * Rd) R = 3.4 * Rd * rng();
        const th = (rng() < 0.8)
          ? Math.log(Math.max(R, 1e-3) / Rd) / Math.tan(PITCH)
            + Math.floor(rng() * 2) * Math.PI + 0.4 * gaussian(rng, 0, 1)
          : 2 * Math.PI * rng();
        X[3 * k] = c.x + R * Math.cos(th);
        X[3 * k + 1] = c.y + R * Math.sin(th);
        X[3 * k + 2] = c.z + gaussian(rng, 0, ZH);
      } else {
        const r = hern(0.6 * Rd), d = dirS();
        X[3 * k] = c.x + r * d[0]; X[3 * k + 1] = c.y + r * d[1]; X[3 * k + 2] = c.z + r * d[2];
      }
      M[k] = 0.2 * (orig === 0 ? M1 : M2) / nd;
      KIND[k] = orig === 0 ? 0 : 1; ORIG[k] = orig; k += 1;
    }
    for (let i = 0; i < nh; i += 1) {
      const r = hern(ha), d = dirS();
      X[3 * k] = c.x + r * d[0]; X[3 * k + 1] = c.y + r * d[1]; X[3 * k + 2] = c.z + r * d[2];
      M[k] = 0.8 * (orig === 0 ? M1 : M2) / nh;
      KIND[k] = orig === 0 ? 2 : 3; ORIG[k] = orig; k += 1;
    }
  }
  place(c1, nd1, nh1, Rd1, A1, 0, true);
  place(c2, nd2, nh2, Rd2, A2, 1, false);
  return { X, V, M, KIND, ORIG, NP, c1, c2, dax, daz };
}

// Set the t=0 velocities from one self-consistent force solve: primary
// disk on circular orbits (small 3D dispersion), halos and the dwarf an
// isotropic 3D dispersion; bulk approach along the inclined axis.
export function setVelocities(g, a0, state) {
  const { X, V, KIND, ORIG, NP, c1, c2, dax, daz } = g;
  const rng = makeRng(0x5EED ^ (state.aoa | 0));
  for (let p = 0; p < NP; p += 1) {
    const c = ORIG[p] === 0 ? c1 : c2;
    const rx = X[3 * p] - c.x, ry = X[3 * p + 1] - c.y, rz = X[3 * p + 2] - c.z;
    const R = Math.hypot(rx, ry) + 1e-6;
    const aR = -(a0[3 * p] * (rx / R) + a0[3 * p + 1] * (ry / R));
    if (KIND[p] === 0) {
      const vC = aR > 0 ? Math.sqrt(aR * R) : 0;
      V[3 * p]     = -vC * (ry / R) + gaussian(rng, 0, 0.06 * vC);
      V[3 * p + 1] =  vC * (rx / R) + gaussian(rng, 0, 0.06 * vC);
      V[3 * p + 2] =  gaussian(rng, 0, 0.06 * vC);
    } else {
      const r3 = Math.hypot(rx, ry, rz) + 1e-6;
      const aR3 = -(a0[3 * p] * rx + a0[3 * p + 1] * ry + a0[3 * p + 2] * rz) / r3;
      const sig = aR3 > 0 ? Math.sqrt(0.4 * aR3 * r3) : 0;
      V[3 * p] = gaussian(rng, 0, sig);
      V[3 * p + 1] = gaussian(rng, 0, sig);
      V[3 * p + 2] = gaussian(rng, 0, sig);
    }
    const sgn = ORIG[p] === 0 ? +1 : -1;
    V[3 * p]     += sgn * state.vRel * dax;
    V[3 * p + 2] += sgn * state.vRel * daz;
  }
}
