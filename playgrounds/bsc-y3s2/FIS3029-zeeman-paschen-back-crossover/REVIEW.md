# REVIEW - zeeman-paschen-back-crossover

## Verdict
CODE FIX + RECAPTURE (+ spec expansion)

## Defects (severity-ranked)

1. **[CRITICAL]** All 5 golden frames byte-identical. CAPTURE_FRAC not read in bootSync().
2. **[BLOCKER]** Placeholder hook and one_paragraph in spec.md lines 12-13.
3. **[HIGH]** Spec.md is skeletal (4 lines only); missing physical setup, equations, controls, features, invariants.

## Physics verification

**Zeeman and Paschen-Back regimes: CORRECT.**

*Weak-field (Zeeman) limit (B << B_c ~= 0.97 T):*
- g-factors for j=3/2 and j=1/2: gFactor() returns 4/3 and 2/3 respectively (lines 20-23), exact.
- Level splitting: g_J m_J mu_B B (weakFieldEnergy()), linear in B, correct limit formula.
- At B=1 T: j=3/2 spans about 2*1.33*0.5*5.788e-5 = 77 micro-eV, j=1/2 spans about 2*0.67*0.5*5.788e-5 = 38 micro-eV; observed values in test output match expected order.

*Strong-field (Paschen-Back) limit (B >> B_c):*
- Splitting formula: (m_L + 2 m_S) mu_B B (strongFieldEnergy()), decoupled LS.
- At B=20 T: extreme states (m_L=1, m_S=+/-1/2) span 4*mu_B*B = 4630.7 micro-eV (test confirms span(80)/span(40) = 2, linearity confirmed).
- Observable: high-B manifold separates into nearly straight lines with slope dE/dB = (m_L + 2 m_S) mu_B.

*Crossover and avoided crossings:*
- Zero-field fine-structure gap: FS_2P_eV = 5.6e-5 eV (line 9, from Griffiths fine-structure value).
- Spin-orbit constant xi = (2/3) FS_2P_eV (line 40), derivable from J=l+s coupling to lowest order.
- Two 2x2 blocks solved in closed form (lines 46-56); eigenvalues represent the avoided crossings where j couples/decouples.
- Critical field B_c where Zeeman term ~ FS: computed as FS/mu_B = 0.97 T, matches test output (line 19).
- Diagram shows level anticrossing at B ~ B_c, characteristic signature of the Breit-Rabi transition.

## Gate: Captures frozen at B=2 T

The playground has a slider (slider-B) that varies the magnetic field. At capture time:
- bootSync() calls render() but does NOT read CAPTURE_FRAC.
- Default state is hardcoded: st = { B: 2 } (line 10).
- All five frames display the same B=2 T crossover state.

**Expected behavior for capture_fraction in [0, 0.25, 0.5, 0.75, 1.0]:**
- Frame 0 (frac=0): B=0 (zero-field fine structure, six degenerate sublevels, two visible clusters).
- Frame 1 (frac=0.25): B approx 0.25 T (weak Zeeman, linear splitting, below critical field).
- Frame 2 (frac=0.5): B=B_c approx 0.97 T (crossover region, avoided crossings visible).
- Frame 3 (frac=0.75): B approx 15 T (strong field, level fans have steepened, approaching quadratic).
- Frame 4 (frac=1.0): B=20 T (Paschen-Back regime, m_L+2m_S decoupled, near-linear fan).

## Fix steps

### Step 1: playground.js bootSync() read CAPTURE_FRAC
playground.js line 55 (in bootSync function), add before render():
```javascript
function bootSync() {
  const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
  if (Number.isFinite(CAPTURE_FRAC) && CAPTURE_FRAC >= 0 && DETERMINISTIC) {
    // Map CAPTURE_FRAC in [0, 1] to B in [0, Bmax].
    st.B = CAPTURE_FRAC * 20;  // Bmax=20 from line 11
    sB.value = st.B;
    vB.textContent = st.B.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}
```

### Step 2: Expand spec.md to full documentation
spec.md lines 22-23, replace one-liner with 60+ lines covering:
- Physical setup: LS coupling, fine-structure Hamiltonian, Zeeman term, regimes.
- Governing equations: H = xi (L.S) + mu_B B (L_z + 2 S_z), with specific coefficients.
- Numerical method: 2x2 block diagonalization for 2p manifold (l=1, s=1/2).
- Controls: B slider (0 to 20 T), play/pause.
- Expected features: Zeeman linear split, anticrossings, Paschen-Back quadratic fan, critical field B_c.
- Invariants: g-factors correct, zero-field fine-structure gap = FS_2P_eV, high-B slope = (m_L+2m_S)mu_B.

Also update frontmatter:
- Line 12: `hook: 'Magnetic-field-induced level crossing and uncoupling of angular momentum: from LS coupling to term symbols.'`
- Line 13: `one_paragraph: 'As the magnetic field strength increases from zero, the hydrogen 2p fine-structure levels smoothly transition from Zeeman (field acts on total J) to Paschen-Back (field decouples L and S). The diagram shows all six sublevels as functions of B, revealing avoided crossings where the two coupling schemes mix. Observe how the slopes change from proportional to g_J m_J (weak field) to m_L+2m_S (strong field).'`

### Step 3: Rerun capture with CAPTURE_FRAC
```bash
npm run capture -- --playground bsc-y3s2/FIS3029-zeeman-paschen-back-crossover --deterministic
```

## Recapture required
YES. After code fix and spec expansion, recapture with B varying from 0 to 20 T across the five frames. The Breit-Rabi diagram should show clear evolution from linear to curved to steeply linear levels.

## One-line summary
NEEDS CODE FIX + RECAPTURE: Zeeman-Paschen-Back physics correct (g-factors, avoided crossings, critical field); playground ignores CAPTURE_FRAC, freezing at B=2 T; spec is skeletal.
