// Monte Carlo photon transport in a water/tissue slab: photoelectric
// absorption, Compton scattering (Klein-Nishina) and Rayleigh
// scattering, with exponential path sampling and a forward
// secondary-electron range that produces the dose build-up
// (Klein and Nishina 1929; Attix 1986). Deterministic given the seed.
import { makeRng } from '../../../shared/js/render/rng.js';

const MEC2 = 510.999;                                    // electron rest energy, keV
const NE_WATER = 3.343e23;                               // electrons / cm^3
const RE = 2.8179403e-13;                                // classical electron radius, cm

// Klein-Nishina total cross section per electron (cm^2) at alpha=E/mec2.
export function kleinNishinaTotal(EkeV) {
  const a = EkeV / MEC2;
  const t1 = (1 + a) / (a * a) * (2 * (1 + a) / (1 + 2 * a) - Math.log(1 + 2 * a) / a);
  const t2 = Math.log(1 + 2 * a) / (2 * a) - (1 + 3 * a) / ((1 + 2 * a) ** 2);
  return 2 * Math.PI * RE * RE * (t1 + t2);
}

// Linear attenuation coefficients (1/cm) for water: Compton from
// Klein-Nishina, photoelectric ~ 1/E^3, Rayleigh ~ 1/E^2 (the latter
// two calibrated so mu_total matches water near 30-100 keV).
const K_PE = 4500;                                       // keV^3 / cm
const K_RAY = 27;                                        // keV^2 / cm
export function crossSections(EkeV) {
  const compton = NE_WATER * kleinNishinaTotal(EkeV);
  const pe = K_PE / (EkeV * EkeV * EkeV);
  const rayleigh = K_RAY / (EkeV * EkeV);
  const mu = compton + pe + rayleigh;
  return { compton, pe, rayleigh, mu, mfp: 1 / mu };
}

// Sample a Compton-scattered photon energy and polar cosine by Kahn's
// rejection method on the Klein-Nishina distribution.
export function comptonSample(EkeV, rng) {
  const a = EkeV / MEC2;
  for (let i = 0; i < 1000; i += 1) {
    const r1 = rng(), r2 = rng(), r3 = rng();
    if (r1 <= (1 + 2 * a) / (9 + 2 * a)) {
      const eps = 1 + 2 * a * r2;                        // epsilon = E/E'
      const t = (2 / a) * (1 - 1 / eps);                 // sin^2 acceptance
      if (r3 <= 1 - eps * (1 - t) / (1 + eps * eps)) {
        const Ep = EkeV / eps;
        return { Eprime: Ep, cosTheta: 1 - (1 / a) * (eps - 1) };
      }
    } else {
      const eps = (1 + 2 * a) / (1 + 2 * a * r2);
      const t = (1 / a) * (eps - 1);
      const ct = 1 - t;
      if (r3 <= 0.5 * (ct * ct + 1 / eps)) {
        return { Eprime: EkeV / eps, cosTheta: ct };
      }
    }
  }
  return { Eprime: EkeV, cosTheta: 1 };
}

// Secondary-electron CSDA range in water (cm), Katz-Penfold fit
// R ~ 0.412 E_MeV^1.27; this sets the forward dose build-up.
export const electronRange = (EkeV) => Math.min(5, 0.412 * Math.pow(Math.max(EkeV, 1) / 1000, 1.27));

const PE = 0, COMPTON = 1, RAYLEIGH = 2;

// Run nPhot photon histories normally incident on a slab of thickness
// L (cm), depth-binned into nBins. Returns the depth dose, the 2D dose
// map, interaction tallies, the sampled free paths and an exact energy
// balance. Deterministic for a given seed.
export function runMC({
  E0 = 1000, nPhot = 4000, L = 15, nBins = 150, seed = 0xC0FFEE, halfY = 7,
  recordTracks = 0,
} = {}) {
  const rng = makeRng(seed);
  const tracks = [];
  const depth = new Float64Array(nBins);
  const MX = 80, MY = 60;
  const map = new Float64Array(MX * MY);
  const tally = { pe: 0, compton: 0, rayleigh: 0 };
  let pathSum = 0, pathN = 0, firstPathSum = 0, firstPathN = 0;
  let deposited = 0, transmitted = 0, backscattered = 0, sideLeak = 0;
  const dz = L / nBins;
  const depositSmear = (x0, dE, y) => {
    deposited += dE;
    const Re = Math.max(dz, electronRange(dE));            // range of the freed electron
    const n = 8;
    for (let k = 0; k < n; k += 1) {
      const xx = x0 + Re * (k + 0.5) / n;
      const b = Math.floor(xx / dz);
      if (b >= 0 && b < nBins) depth[b] += dE / n;
      const mx = Math.floor(xx / L * MX);
      const my = Math.floor((y + halfY) / (2 * halfY) * MY);
      if (mx >= 0 && mx < MX && my >= 0 && my < MY) map[my * MX + mx] += dE / n;
    }
  };
  for (let p = 0; p < nPhot; p += 1) {
    let x = 0, y = 0, ux = 1, uy = 0, E = E0, alive = true, depthMax = 0, first = true;
    const rec = p < recordTracks;
    const tk = rec ? { pts: [[0, 0]], events: [] } : null;
    while (alive) {
      const cs = crossSections(E);
      const s = -Math.log(Math.max(1e-12, rng())) / cs.mu;
      pathSum += s; pathN += 1;
      if (first) { firstPathSum += s; firstPathN += 1; first = false; }
      x += s * ux; y += s * uy;
      if (rec) tk.pts.push([Math.max(0, Math.min(L, x)), y]);
      if (x >= L) { transmitted += E; if (rec) tk.exit = 'transmit'; break; }
      if (x < 0) { backscattered += E; if (rec) tk.exit = 'back'; break; }
      if (Math.abs(y) > halfY) { sideLeak += E; if (rec) tk.exit = 'side'; break; }
      depthMax = Math.max(depthMax, x);
      const r = rng() * cs.mu;
      let kind = PE;
      if (r < cs.compton) kind = COMPTON;
      else if (r < cs.compton + cs.rayleigh) kind = RAYLEIGH;
      if (rec) tk.events.push({ x: Math.max(0, Math.min(L, x)), y, kind });
      if (kind === PE) {
        tally.pe += 1; depositSmear(x, E, y); E = 0; alive = false;
      } else if (kind === RAYLEIGH) {
        tally.rayleigh += 1;
        const ct = 1 - 2 * rng() * rng();                // mildly forward
        const st = Math.sqrt(Math.max(0, 1 - ct * ct)), ph = 2 * Math.PI * rng();
        const nux = ux * ct + st * Math.cos(ph) * (-uy) + 0;
        const nuy = uy * ct + st * Math.cos(ph) * (ux);
        const nn = Math.hypot(nux, nuy) || 1; ux = nux / nn; uy = nuy / nn;
      } else {
        tally.compton += 1;
        const { Eprime, cosTheta } = comptonSample(E, rng);
        depositSmear(x, E - Eprime, y);
        E = Eprime;
        const st = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta)), ph = 2 * Math.PI * rng();
        const nux = ux * cosTheta - uy * st * Math.cos(ph);
        const nuy = uy * cosTheta + ux * st * Math.cos(ph);
        const nn = Math.hypot(nux, nuy) || 1; ux = nux / nn; uy = nuy / nn;
        if (E < 1) { depositSmear(x, E, y); E = 0; alive = false; }
      }
    }
    if (rec) tracks.push(tk);
  }
  let dmax = 0; for (const v of depth) dmax = Math.max(dmax, v);
  return {
    depth, map, MX, MY, tally, L, nBins, dz, E0, nPhot, tracks, halfY,
    mfpEmpirical: pathSum / pathN,
    mfpFirstFlight: firstPathSum / firstPathN,
    energy: { deposited, transmitted, backscattered, sideLeak, input: nPhot * E0 },
    dmaxBin: depth.indexOf(dmax),
  };
}

// Interaction-type fractions at a given energy from the cross sections.
export function interactionFractions(EkeV) {
  const c = crossSections(EkeV);
  return { pe: c.pe / c.mu, compton: c.compton / c.mu, rayleigh: c.rayleigh / c.mu };
}
