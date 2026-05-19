// Aperture synthesis on the UV plane: the pure physics, headless and
// testable. A radio interferometer samples the sky's Fourier
// transform (the visibility) at the (u, v) point of every antenna
// pair; as Earth rotates, each baseline sweeps an ellipse in the UV
// plane (Earth-rotation synthesis). The dirty image is the inverse
// transform of the sampled visibility, equal to the true sky
// convolved with the dirty beam (the inverse transform of the UV
// sampling). Reference: Thompson, Moran and Swenson, Interferometry
// and Synthesis in Radio Astronomy, Ch. 4; Taylor, Carilli and
// Perley, Synthesis Imaging in Radio Astronomy II.

export const R_EARTH_KM = 6378.0;

// Geocentric XYZ (km) of a station at geodetic lat/lon (spherical Earth).
export function stationXYZ(latDeg, lonDeg) {
  const lat = latDeg * Math.PI / 180, lon = lonDeg * Math.PI / 180;
  return {
    x: R_EARTH_KM * Math.cos(lat) * Math.cos(lon),
    y: R_EARTH_KM * Math.cos(lat) * Math.sin(lon),
    z: R_EARTH_KM * Math.sin(lat),
  };
}

// Baseline (km) for the pair, expressed in wavelengths at lambda (mm).
export function baselineLambda(a, b, lambdaMm) {
  const k = 1e6 / lambdaMm;                       // km -> mm -> wavelengths
  return { bx: (b.x - a.x) * k, by: (b.y - a.y) * k, bz: (b.z - a.z) * k };
}

// (u, v) of a baseline (in wavelengths) at hour angle H (rad) for a
// source at declination dec (rad). Standard TMS eq. 4.1 (rows 1,2).
export function uv(bx, by, bz, H, dec) {
  const u = Math.sin(H) * bx + Math.cos(H) * by;
  const v = -Math.sin(dec) * Math.cos(H) * bx
          + Math.sin(dec) * Math.sin(H) * by
          + Math.cos(dec) * bz;
  return { u, v };
}

// Longest projected baseline (wavelengths) over all pairs at H=0,
// used for the plot scale and the angular resolution.
export function maxBaseline(stations, lambdaMm) {
  let m = 1;
  for (let i = 0; i < stations.length; i += 1) {
    for (let j = i + 1; j < stations.length; j += 1) {
      const b = baselineLambda(stations[i], stations[j], lambdaMm);
      const L = Math.hypot(b.bx, b.by, b.bz);
      if (L > m) m = L;
    }
  }
  return m;
}

// Diffraction-limited resolution (mas) ~ 1 / (max baseline in wavelengths).
export function resolutionMas(stations, lambdaMm) {
  return (1 / maxBaseline(stations, lambdaMm)) * 206264.806 * 1000;
}

// Dirty beam B(dl, dm) = (1/M) sum over samples cos(2 pi (u dl + v dm)).
// Real and centro-symmetric because the sampling is taken with its
// Hermitian conjugate (every (u,v) has a (-u,-v) partner).
export function dirtyBeam(samples, dl, dm) {
  let s = 0;
  for (let k = 0; k < samples.length; k += 1) {
    s += Math.cos(2 * Math.PI * (samples[k].u * dl + samples[k].v * dm));
  }
  return samples.length ? s / samples.length : 0;
}

// Dirty image of a point-source sky model on an N x N (l, m) grid of
// half-extent fovRad (rad): the dirty beam placed at each source.
export function dirtyImage(samples, srcs, N, fovRad) {
  const img = new Float64Array(N * N);
  const step = (2 * fovRad) / (N - 1);
  for (let j = 0; j < N; j += 1) {
    const m = -fovRad + j * step;
    for (let i = 0; i < N; i += 1) {
      const l = -fovRad + i * step;
      let acc = 0;
      for (const sc of srcs) acc += sc.amp * dirtyBeam(samples, l - sc.l, m - sc.m);
      img[j * N + i] = acc;
    }
  }
  return img;
}
