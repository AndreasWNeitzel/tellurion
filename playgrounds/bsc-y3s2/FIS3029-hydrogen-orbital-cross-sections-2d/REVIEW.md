# REVIEW - hydrogen-orbital-cross-sections-2d

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY + MISSING READOUT

## Defects (severity-ranked)

1. **[CRITICAL BLOCKER]** Spec lists 'live-readout' tag but HTML has zero readout elements. Gate requires visible invariant readout.
2. **[HIGH]** Placeholder hook in spec.md line 11: 'STATUS: needs_hook' not removed.
3. **[HIGH]** Deprecation status: playground is marked deprecated and superseded_by hydrogen-orbitals-3d.

## Physics verification

**Hydrogen orbital wavefunctions: CORRECT.**
- Radial part R_nl(r) via associated Laguerre recurrence (sim.js lines 22-35): standard formula, numerically stable.
- Real spherical harmonics Y_l^m (lines 65-77): Condon-Shortley phase, standard cubic forms, correct normalization.
- Normalization verified: integral R_nl^2 r^2 dr = 1 within 1 percent for (n,l) in {(1,0), (2,0), (2,1), (3,0), (3,1), (3,2)}; all invariant tests pass.
- Radial node count: n-l-1 verified for all tested orbitals.
- |psi_100(0)|^2 = 1/pi exactly (ground state peak).
- 2p_z angular anisotropy verified: |psi|^2 along z exceeds |psi|^2 along x at the same radius r.

## Gate: Missing readout element

The playground.js renders orbital density plots on canvas (playground.js lines 40-70, using viridis colormap). However:
- No HTML readout div exists in index.html (lines 1-77, no <div class="readout">).
- No canvas-drawn readout overlay (unlike TDSE and other playgrounds that print monospace stats onto the canvas).
- The spec lists 'live-readout' tag (line 14) but there is no visible readout.

**Gate requirement**: A monospace readout should display at minimum n, l, m quantum numbers and/or normalization/radial nodes/span information.

## Fix steps

### Step 1: Replace placeholder hook and one_paragraph
spec.md lines 11-12:
```yaml
hook: 'Hydrogen orbital density cross-sections: radial nodes, angular lobes, and nodal patterns revealed in the (x,z) plane.'
one_paragraph: 'Interactive 2D cross-section of the hydrogen orbital probability density |psi_nlm|^2 in the plane containing the nucleus and z-axis. The radial part sets the extent and nodal structure; the angular part sets the lobe geometry. Vary the orbital to observe how quantum numbers n, l, m control the size, number of radial nodes, and angular shape. The heatmap color intensity (gamma-corrected) shows probability density from center (bright) to tail (faint).'
```

### Step 2: Add canvas-drawn readout to playground.js
After the main orbital heatmap is drawn (line 70), add a monospace readout overlay:

```javascript
// Readout overlay at bottom
ctx.fillStyle = '#9aa0a6';
ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
const orb = ORBITALS[state.idx];
const readoutText = `n=${orb.n}, l=${orb.l}, m=${orb.m}; radial nodes=${orb.n - orb.l - 1}; span=${state.span.toFixed(1)} a_0`;
ctx.fillText(readoutText, PLOT_X + 4, H - 12);
```

### Step 3: Deprecation notice
Update spec.md frontmatter (line 4):
```yaml
status: deprecated
deprecation_notice: 'Superseded by hydrogen-orbitals-3d for full 3D visualization. This 2D cross-section remains pedagogically useful for teaching radial and angular node structure.'
```

## Recapture required
NO. Readout is text-only, added to canvas after the orbital heatmap. Existing golden frames remain valid (heatmap unchanged); recapture only needed if ORBIT_IDX (the selected orbital) is made variable via CAPTURE_FRAC (currently not).

## One-line summary
RENDER-NEUTRAL TEXT FIX ONLY + MISSING READOUT: Hydrogen orbital wavefunctions correct; add canvas-drawn monospace readout showing n, l, m, radial nodes; replace placeholder hook.
