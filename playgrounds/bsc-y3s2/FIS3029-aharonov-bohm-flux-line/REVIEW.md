# REVIEW - aharonov-bohm-flux-line

## Verdict
CODE FIX + RECAPTURE

## Defects (severity-ranked)

1. **[CRITICAL]** All 5 golden frames byte-identical. CAPTURE_FRAC not read in bootSync().
2. **[BLOCKER]** Placeholder hook and one_paragraph in spec.md lines 12-13.
3. **[HIGH]** Sparse spec.md (only 23 lines, two-line physics stub).

## Physics verification

**Aharonov-Bohm phase: CORRECT.**
- Flux quantum Phi_0 = h/e = 4.14e-15 Wb (sim.js line 7).
- Phase shift formula: phi = Phi / Phi_0 (phaseShift() function, lines 8-11).
- Fringe shift: (e/hc) integral A.dl = (e/hc) Phi_B, verified to exact arithmetic in tests (shift=0, 0.5, 1.0, 2.0, 3.5 cycles).
- Double-slit intensity: I(x) = 1 + cos(k d x / D + phi), verified for boundary cases (I(x=0, phi=0)=2, I(x=0, phi=pi)=0, I(x=0, phi=pi/2)=1).

## Gate: Captures frozen

The playground has an interactive slider (slider-p) that varies the AB phase. At capture time:
- bootSync() calls render() but does NOT read CAPTURE_FRAC.
- Default state is hardcoded: st = { phi: 0 } (line 9).
- All five frames capture zero flux and no fringe shift.

**Expected behavior for capture_fraction in [0, 0.25, 0.5, 0.75, 1.0]:**
- Frame 0 (frac=0): phi=0 (constructive interference, bright center).
- Frame 1 (frac=0.25): phi=0.25 cycles (quarter-shift).
- Frame 2 (frac=0.5): phi=0.5 cycles (half-shift, fringes inverted).
- Frame 3 (frac=0.75): phi=0.75 cycles (three-quarter-shift).
- Frame 4 (frac=1.0): phi=1.0 cycles (full shift, back to constructive).

## Fix steps

### Step 1: playground.js bootSync() read CAPTURE_FRAC
playground.js line 47, replace:
```javascript
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(...); }
```
with:
```javascript
function bootSync() {
  if (CAPTURE_FRAC >= 0 && DETERMINISTIC) {
    // Map CAPTURE_FRAC in [0, 1] to flux shift in [0, 1] cycles.
    st.phi = CAPTURE_FRAC;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}
```

### Step 2: Expand spec.md with proper documentation
spec.md lines 21-23, replace the two-liner with full spec (60+ lines: physical setup of solenoid and double slit, Aharonov-Bohm phase formula, controls, expected fringe shifts, invariants, citations).

Also update spec.md frontmatter:
- Line 12: `hook: 'Quantum interference with enclosed magnetic flux reveals topological phase, not local field.'`
- Line 13: `one_paragraph: 'The Aharonov-Bohm effect demonstrates that a charged particle can be affected by a vector potential A even in regions where the magnetic field B is zero. A solenoid behind a double slit encloses flux Phi; electron paths pick up a phase shift proportional to Phi/Phi_0 (flux quanta), shifting the interference fringes even though B=0 in the detection region. Vary the enclosed flux to observe the continuous fringe shift.'`

### Step 3: Rerun capture with CAPTURE_FRAC
```bash
npm run capture -- --playground bsc-y3s2/FIS3029-aharonov-bohm-flux-line --deterministic
```

## Recapture required
YES. After code fix and spec expansion, recapture the golden frames with flux phi varying from 0 to 1 cycle across the five frames. The fringe pattern should visibly shift.

## One-line summary
NEEDS CODE FIX + RECAPTURE: AB phase formula and intensity pattern correct; playground ignores CAPTURE_FRAC, freezing all frames at zero flux (constructive interference); spec is skeletal.
