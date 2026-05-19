// Thin wrapper around the shared laser rate-equation engine for the
// laser-cavity-3d hero. Renderer and invariants both consume this
// exact dynamics; the threshold and the Q-switch are emergent.
export {
  cavityLifetime, thresholdInversion, thresholdPump, makeLaser, step,
  outputPower, steadyState,
} from '../../../shared/js/engine/laser-rate-cpu.js';
