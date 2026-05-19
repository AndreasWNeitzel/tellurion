// Thin wrapper around the shared Ellis/Morris-Thorne wormhole engine
// for the wormhole-traversal-3d hero. The ray-march shader and the
// invariants both consume this exact geometry.
export {
  circumferentialR, embedZ, flareOut, criticalImpact, nullNorm,
  tracePhoton, properDistance, tidalScale,
} from '../../../shared/js/engine/wormhole-cpu.js';
