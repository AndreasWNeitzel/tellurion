// Thin wrapper around the shared Schwarzschild geodesic engine for
// the blackhole-geodesics-3d hero. The lensed-background shader is
// reused from shared/js/engine-gl/schwarzschild-kerr.js; the geodesic
// physics (and the invariants) come through here.
export {
  schwarzschildRadius, photonSphere, bCrit, iscoSchwarzschild,
  vTimelike, wNull, nullInvariant, integrateGeodesic,
} from '../../../shared/js/engine/schwarzschild-geodesic-cpu.js';
