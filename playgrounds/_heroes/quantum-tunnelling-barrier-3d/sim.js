// Thin wrapper around the shared Crank-Nicolson TDSE engine for the
// quantum-tunnelling-barrier-3d hero. Renderer and invariants both
// consume this exact unitary integrator.
export {
  makeTDSE, setPacket, setPotential, sculptV, step, norm, fluxSplit,
  rectBarrierT,
} from '../../../shared/js/engine/tdse-cn-cpu.js';
