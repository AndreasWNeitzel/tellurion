// Thin wrapper around the shared exoplanet-interior engine.
export {
  RHO, solvePlanet, massRadiusCurve, pressureProfile, densityAt,
  massEarth, radiusEarth, normaliseFractions,
} from '../../../shared/js/engine/exoplanet-interior-cpu.js';
