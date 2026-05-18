# REVIEW - addition-of-angular-momenta

## Verdict
CODE FIX + RECAPTURE

## Defects (severity-ranked)

1. **[CRITICAL]** All 5 golden frames byte-identical. CAPTURE_FRAC not read in bootSync().
2. **[BLOCKER]** Placeholder hook and one_paragraph in spec.md lines 12-13.
3. **[HIGH]** Sparse spec.md (only 23 lines, two-line physics stub).

## Physics verification

**Clebsch-Gordan coupling: CORRECT.**
- Sum rule verified: for all test pairs (j1, j2), multiplicity (2j1+1)(2j2+1) equals sum of (2J+1) over allowed J.
- j1=1/2, j2=1/2 yields J=0,1 (total dim=4). j1=1, j2=1 yields J=0,1,2 (total dim=9). All invariant tests pass.
- Code uses correct formula allowedJ(): J ranges from |j1-j2| to j1+j2 in integer steps.

## Gate: Captures frozen

The playground has interactive sliders (slider-j1, slider-j2) that vary the coupling. At capture time:
- bootSync() calls render() but does NOT read CAPTURE_FRAC.
- Default state is hardcoded: st = { j1: 0.5, j2: 0.5 } (line 10).
- All five frames capture this same coupling state.

**Expected behavior for capture_fraction in [0, 0.25, 0.5, 0.75, 1.0]:**
- Frame 0 (frac=0): j1=0.5, j2=0.5 (default).
- Frame 1 (frac=0.25): j1=0.5, j2=1 or j1=1, j2=0.5.
- Frame 2 (frac=0.5): j1=1, j2=1 (symmetric).
- Frame 3 (frac=0.75): j1=1.5, j2=1.
- Frame 4 (frac=1.0): j1=2, j2=1 (high angular momenta).

## Fix steps

### Step 1: playground.js bootSync() read CAPTURE_FRAC
playground.js line 52, replace:
```javascript
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...); }
```
with:
```javascript
function bootSync() {
  if (CAPTURE_FRAC > 0 && DETERMINISTIC) {
    // Map CAPTURE_FRAC in [0, 1] to slider values.
    // Slider range: j in [0, 4] => physics j in [0, 2].
    const j_vals = [0.5, 1, 1.5, 2];  // Allow steps in 0.5 units
    const j_idx = Math.floor(CAPTURE_FRAC * j_vals.length);
    const j_clamped = j_vals[Math.min(j_idx, j_vals.length - 1)];
    st.j2 = j_clamped;  // Vary j2, keep j1 at 0.5
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}
```

### Step 2: Expand spec.md with proper documentation
spec.md lines 21-23, replace the two-liner with full spec (60 lines of physical setup, equations, controls, features, invariants, citations).

Also update spec.md frontmatter:
- Line 12: `hook: 'Angular momentum coupling via tensor-product decomposition into irreducible representations.'`
- Line 13: `one_paragraph: 'Quantum mechanical addition of two angular momenta into a single coupled total angular momentum J. Explore how the tensor product Hilbert space decomposes into irreducible representations, labeled by total angular momentum quantum number J. The controls vary the two input angular momenta, showing the allowed J values and the dimension of each coupled subspace.'`

### Step 3: Rerun capture with CAPTURE_FRAC
```bash
npm run capture -- --playground bsc-y3s2/FIS3029-addition-of-angular-momenta --deterministic
```

## Recapture required
YES. After code fix and spec expansion, recapture the golden frames with j2 varying from 0.5 to 2.0 across the five frames.

## One-line summary
NEEDS CODE FIX + RECAPTURE: Clebsch-Gordan coupling physics correct; playground ignores CAPTURE_FRAC, freezing all frames at j1=j2=0.5; spec is skeletal.
