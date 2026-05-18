# Spin Valve: GMR/TMR Hysteresis and the Two-Current Model

This playground runs a spin valve: two ferromagnetic layers separated
by a metallic spacer (giant magnetoresistance) or a tunnel barrier
(tunnel magnetoresistance). The top panel is the resistance-versus-field
hysteresis loop; the lower-left panel is the layer stack with the free
and pinned magnetisation arrows; the lower-right panel is the model
curve, the two-current GMR = beta^2/(1-beta^2) or the Julliere
TMR = 2 P^2/(1-P^2). The applied field sweeps automatically so the
operating point and the magnetisations animate around the loop.

Watch the arrows in the stack. At a large field both layers point the
same way (parallel, low resistance). As the field reverses past the
free layer's coercive field, only the free layer flips: now the layers
are antiparallel and the resistance jumps to its high value, until the
field is strong enough to drag the pinned layer over too and the stack
returns to parallel. Because the two layers switch at different fields
the resistance retraces a different path going up than coming down,
which is the open hysteresis loop. The parallel state is always the
low-resistance one (the two-current arithmetic-harmonic-mean
inequality), and pushing the polarisation toward 1 (a half-metal) sends
the magnetoresistance toward infinity.

`model` switches between the metallic GMR (two-current) and the tunnel
TMR (Julliere) descriptions. `spin polarization P` sets the channel
asymmetry or electrode polarisation, hence the magnetoresistance ratio.
`free-layer Hc` sets how soft the free layer is and therefore how wide
the antiparallel field window is. Reset returns to GMR, P = 0.5,
Hc = 0.3. Pause/Play stops or replays the field sweep, and Copy URL
shares the exact state. The full loop is always drawn, so the physics
reads with `prefers-reduced-motion`.

## Reference

Primary citation: `julliere1975` (the TMR model); see also `mott1936`
(two-current model), `baibich1988` (GMR discovery), and `dieny1991`
(the spin valve).

## Verification

- Strong invariant: `R_P < R_AP` always; GMR `= beta^2/(1-beta^2)`
  and Julliere `TMR = 2 P1 P2/(1 - P1 P2)` consistent with the
  resistance ratio within 1%; the loop is hysteretic.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
