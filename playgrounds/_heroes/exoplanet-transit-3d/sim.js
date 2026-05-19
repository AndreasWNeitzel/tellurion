// Thin wrapper around the shared transit engine for the
// exoplanet-transit-3d hero. Renderer (3D star + planet on a
// Keplerian orbit) and invariants both consume this exact light
// curve.
export {
  semiMajorAxis, periodFromAxis, intensity, makeTransit, planetSkyPos,
  transitFlux,
} from '../../../shared/js/engine/transit-cpu.js';
