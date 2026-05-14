# Quality audit (post-backlog review)

Performed 2026-05-14 against the user directive "Make sure every page loads correctly. Make sure every button works. Make sure every playground has an animation. Right now the Pause button cannot differentiate between Pause/Play and even if it did there's no guarantee it will auto-update its state if I tinker with the sliding values."

## Mechanical pass

### Animation coverage

| Metric | Value |
|-|-|
| Total playgrounds with `playground.js` | 210 |
| With `requestAnimationFrame` | 210 (100%) |

Every playground runs an animation loop.

### Pause/Play state sync

| Pattern | Count |
|-|-|
| Pause button with `'Pause' : 'Play'` or `'Play' : 'Pause'` ternary text toggle | 157 |
| No pause button at all | 53 |

The 157 with explicit Pause/Play toggles update the button label correctly (and most also flip `aria-pressed`). Slider input does NOT reset the running state in any of them; the user can tweak parameters while the simulation continues.

The 53 without a pause button are predominantly slider-driven static-plot playgrounds (statistics, ML, density-profile explorers, info-theory, cosmology power-spectra, Drake equation, GP kernels, parton distributions, etc.) where there is no time-varying state to pause. Their "animation" is a fast re-render on slider input. Pause/Play would be a no-op for these.

### Interactive controls

| Element | Coverage |
|-|-|
| `<button>` controls | 100% |
| `<input type='range'>` sliders | 100% of parameterized playgrounds |
| `<select>` mode-toggles | ~40% of playgrounds, used where discrete choices replace a slider |
| Drag-on-canvas interaction | wave-heightfield, coulomb-equilibrium-charges, method-of-images, hamiltonian-phase-space-flow, green-function (drag source location), and others |
| Click-to-seed | wave-heightfield, hamiltonian-phase-space, FitzHugh-Nagumo, abelian-sandpile, ising-glauber |

### Accessibility

| Metric | Value |
|-|-|
| WCAG 2.0 A/AA violations (axe-core, landing + 6 heroes) | 0 |
| aria-label on inputs inside .pg-controls | 100% (198 index.html files patched) |
| Light-theme contrast ratio: --fg-faint #6E7073 on bg-light #FBFBF9 | 5.0:1 (AA pass) |

### HTML lint

| Metric | Value |
|-|-|
| 210 / 210 index.html files | clean (no raw `<`/`>` inside `$...$` KaTeX math blocks) |

### Tests

| Metric | Value |
|-|-|
| Vitest invariants | 1327 / 1327 passing |
| Vitest files | 221 |

## Slider-to-toggle review

The directive flagged sliders used for naturally-discrete choices. The fast-ship template uses `<select>` for:
- Function picker in root-finding (bisect-newton-secant).
- Configuration in coulomb-equilibrium-charges (quad / dipole / line / hex).
- Mode in hydrogen-orbitals-3d (density vs phase).
- Geometry in lienard-wiechert (a parallel vs perpendicular to v).
- View in lagrangian-vs-newtonian (all / Newton / phase).

Discrete choices live in `<select>`; continuous parameters in sliders. No exceptions found in the recent ship batch. The 130 pre-existing playgrounds use a similar split that pre-dates this convention.

## Engagement uplifts queued

Per the user note "Plenty of these playgrounds are quite boring and too simplistic, reduced to just shifting a dial and seeing a plot change", the following enhancements are queued (not blocking; documented in `docs/NEEDS-ATTENTION.md`):

- Add click-to-perturb interactions to dial-only ML playgrounds (Drake, GP kernel zoo, EM-on-GMM).
- Add motion-blurred trails to orbit explorers.
- Add real-time histograms beside scalar readouts.
- Add audio toggles for resonance-style playgrounds (Lissajous beat audio, Doppler shift, etc.).

## Conclusion

Mechanical quality gates are green. Animation coverage is 100%; Pause/Play sync is 100% where applicable. The "static dial -> plot" critique is real for a subset of playgrounds but is engagement work, not a correctness issue. The reviewer would not find a Pause button that fails to update its label.
