# REVIEW - fine-structure-hydrogen

## Verdict
CODE FIX + RECAPTURE

## Defects (severity-ranked)

1. **[CRITICAL]** All 5 golden frames byte-identical. CAPTURE_FRAC not read in bootSync().
2. **[BLOCKER]** Placeholder hook and one_paragraph in spec.md lines 12-13.
3. **[HIGH]** Sparse spec.md (only 23 lines, one-line physics stub).

## Physics verification

**Fine-structure splitting: CORRECT.**
- Rydberg constant Ry = 13.606 eV (sim.js line 5, matches CODATA).
- Fine-structure constant alpha = 7.297e-3 (line 6, precise).
- Bohr energy: E_n = -Ry / n^2 (bohrEnergy(), correct).
- Fine-structure correction: Delta E_FS = -(alpha^2 Ry / n^4) (n / (j + 1/2) - 3/4) (fineStructureDelta(), lines 8-11, matches Griffiths 6.95).
- 2p splitting (j=3/2 minus j=1/2): 4.528e-5 eV, matches expected scale alpha^2 Ry / n^4 = 4.528e-5 eV.
- Level ordering verified: fsLevel(n, j_high) > fsLevel(n, j_low) for all test cases; spin-orbit coupling correct sign.

## Gate: Captures frozen at nMax=3

The playground has interactive sliders (slider-n, slider-m) that vary the principal quantum number and magnification. At capture time:
- bootSync() calls render() but does NOT read CAPTURE_FRAC.
- Default state is hardcoded: st = { nMax: 3, mag: 3000 } (line 10).
- All five frames show the same energy levels (n=1,2,3).

**Expected behavior for capture_fraction in [0, 0.25, 0.5, 0.75, 1.0]:**
- Frame 0 (frac=0): nMax=1 (ground state only, no fine structure visible).
- Frame 1 (frac=0.25): nMax=2 (2s and 2p levels with visible splitting).
- Frame 2 (frac=0.5): nMax=3 (richer level diagram with more sublevels).
- Frame 3 (frac=0.75): nMax=4 (d-orbital levels added).
- Frame 4 (frac=1.0): nMax=5 (largest n in playable range).

## Fix steps

### Step 1: playground.js bootSync() read CAPTURE_FRAC
playground.js line 55, replace:
```javascript
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...); }
```
with:
```javascript
function bootSync() {
  if (CAPTURE_FRAC >= 0 && DETERMINISTIC) {
    // Map CAPTURE_FRAC in [0, 1] to nMax in [1, 5].
    const nMax_min = 1, nMax_max = 5;
    st.nMax = Math.round(nMax_min + CAPTURE_FRAC * (nMax_max - nMax_min));
    sN.value = st.nMax;
    vN.textContent = st.nMax;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}
```

### Step 2: Expand spec.md with proper documentation
spec.md lines 21-23, replace the one-liner with full spec (70+ lines: physical setup of relativistic corrections, spin-orbit coupling, Hamiltonian form, controls, expected features for varying n, invariants testing, citations to Griffiths and Sakurai).

Also update spec.md frontmatter:
- Line 12: `hook: 'Relativistic and spin-orbit corrections split the degenerate Bohr levels.'`
- Line 13: `one_paragraph: 'Hydrogen fine structure arises from two relativistic effects: the kinetic-energy correction (electron velocity comparable to c) and spin-orbit coupling (L.S interaction). The degeneracy of the Bohr level E_n is lifted; states with the same (n,l) split by 2j+1 = (spin 1/2 gives j = l +/- 1/2). Vary the maximum principal quantum number to explore the energy landscape and observe how the fine-structure splitting scales as alpha^2 / n^4.'`

### Step 3: Rerun capture with CAPTURE_FRAC
```bash
npm run capture -- --playground bsc-y3s2/FIS3029-fine-structure-hydrogen --deterministic
```

## Recapture required
YES. After code fix and spec expansion, recapture the golden frames with nMax varying from 1 to 5 across the five frames. The energy-level diagram should visibly expand and show increasing sublevel complexity.

## One-line summary
NEEDS CODE FIX + RECAPTURE: Fine-structure physics and formulas correct; playground ignores CAPTURE_FRAC, freezing all frames at nMax=3; spec is skeletal.
