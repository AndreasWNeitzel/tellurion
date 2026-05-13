# shared/js/controls/

Reusable UI controls. Each is a small ES module that mounts into a container and emits change events. Keep the surface minimal: knob, drag handle, parameter panel, play/pause, reset, theme toggle.

Constraints from `docs/AESTHETIC.md`:

- At most five primary controls visible per playground. Secondary controls go behind a `<details>` disclosure.
- Prefer direct manipulation (drag handles on the figure itself) over sliders for geometric quantities.
- All controls inherit colors and typography from `shared/css/tokens.css`. No per-control style overrides.

## Stubs to implement

| name | purpose |
|------|---------|
| knob.js | rotary input for scalar parameters with logarithmic option |
| drag-handle.js | draggable point on a Canvas/SVG figure, emits position |
| parameter-panel.js | layout container for grouped controls |
| play-pause.js | start/stop and step-once buttons |
| reset-button.js | reseed and clear-state action |
| theme-toggle.js | manual override of prefers-color-scheme, persists in localStorage |
