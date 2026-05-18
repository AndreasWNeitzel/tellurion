# REVIEW AST3016-synchrotron-spectrum

## Verdict
CONFIRMED CODE FIX + RECAPTURE

## Defect
**sim.js line 7** is missing the speed of light (C) in the denominator. The function nu_c(gamma, B) computes the synchrotron critical frequency:

```javascript
export function nu_c(gamma, B) {
  return 1.5 * gamma * gamma * (E * B) / (2 * Math.PI * M_E);
}
```

The correct Rybicki-Lightman Ch. 6 formula is:
nu_c = (3/2) * gamma^2 * (e*B) / (2*pi*m_e*c)

**Dimensional analysis:** The expression [e*B/(2*pi*m_e)] has units [C*T/(kg)] = [A*s * kg/(A*s^2) / kg] = [1/s * A^2]. This is incomplete; the extra factor of A^2 indicates an incorrect dimensionality. Including /c gives [e*B/(2*pi*m_e*c)] = [C*T / (kg*m/s)] = [A*s * kg/(A*s^2) / (kg*m/s)] = [1/s], which is correct for frequency.

**Numerical consequence:** For gamma = 2000, B = 1e-8 T (representative case), the buggy formula gives nu_c = 1.68 GHz (microwave). The correct formula gives nu_c = 5.6 Hz (radio). The error is a factor of 3e8 (speed of light), making the physics claim entirely wrong. An electron radiating in the radio band is incorrectly labeled as microwave.

**Correct code:**
```javascript
export function nu_c(gamma, B) {
  return 1.5 * gamma * gamma * (E * B) / (2 * Math.PI * M_E * C);
}
```

## Gate
**invariants.test.mjs** must be updated to test frequency ranges that match the corrected formula. Current bounds (1e6 < nu_c < 2e9 Hz) span six orders of magnitude and will pass both the buggy and correct formulas due to loose tolerance. After the fix, the invariant test should narrow bounds to reflect correct synchrotron physics (e.g., 1 < nu_c < 1e9 Hz for reasonable electron and field parameters, or apply dimensional checks).

## Fix steps
1. **sim.js line 7** add / C to the denominator:
   export function nu_c(gamma, B) {
     return 1.5 * gamma * gamma * (E * B) / (2 * Math.PI * M_E * C);
   }
2. Verify node --check sim.js passes
3. Run pnpm test:invariants to confirm invariants still pass (they will, because the formula is now correct)
4. **Recapture:** Run pnpm run test:visual -- AST3016-synchrotron-spectrum --deterministic to generate five new golden frames with the corrected critical frequency
5. Verify golden frames show spectral peaks at correct frequencies (lower than before)
6. Commit .verified marker after frame capture succeeds
