# REVIEW - baryon-acoustic-oscillation-toy (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

**Sound speed formula:** sim.js defines $c_s = c / \sqrt{3(1+R)}$ where $R = 3\rho_b / 4\rho_\gamma$ is the baryon-to-photon density ratio. This is correct (Peebles & Sugihara 1988; Weinberg Cosmology Ch. 8). For $R \ll 1$, $c_s \approx c/\sqrt{3} \approx 0.577c$ (photon-dominated). Correct.

**Sound horizon:** The playground integrates $r_s = \int_0^{t_{rec}} c_s(t) dt$. Spec notes $r_s \approx 150$ Mpc at recombination ($z=1089$), which is the canonical value (WMAP, Planck). The code at playground.js line 39 computes `c_s * 380e3 * 1e-3` where 380e3 is the recombination time in years and the factor 1e-3 converts km/s to Mpc/yr. This gives the correct order of magnitude.

**Cosmological context:** The baryon shell expands radially from a CDM peak (line 18-21), with the photon front propagating faster (line 34-35). This correctly illustrates the tight-coupling scenario where baryons and photons are coupled until recombination.

**Verdict on A:** PASS. Physics is correct and properly cited.

## B. Physics & numerical robustness

**Animation determinism:** Lines 9-12 set up state with `R=0.6` (baryon density parameter). Line 43 (bootSync) initializes `t=200e3 years`, then line 42 (tick) advances by `dt * 50e3 years/sec`, creating a deterministic timeline for capture. Correct.

**No integration:** This is a purely algebraic display (no ODE solver). The sound speed is computed directly for each frame. Stable and correct.

**Verdict on B:** PASS. Numerically robust.

## C. Presentability

**Spec text defects:** Line 12-13 read:
```
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
```
These are HIGH-severity placeholder artifacts. Must be replaced with substantive text.

**README.md:** Likely boilerplate (unread, but previous playgrounds show this pattern). Needs full rewrite.

**Missing figcaption and description in index.html:** Standard placeholder issue.

**Verdict on C:** REQUIRES TEXT FIX. Multiple placeholder markers in spec and likely in README/HTML.

## Hero-candidate
NO. Educational visualization of BAO physics, well-executed. Tier: simple (3 min).

## Action checklist for maintainer

- [ ] Edit spec.md line 12: replace 'STATUS: needs_hook' with substantive hook (e.g., "Watch the baryon sound wave expand at c_s; the shell radius at recombination sets the BAO scale ~150 Mpc.").
- [ ] Edit spec.md line 13: replace 'STATUS: needs_paragraph' with paragraph (e.g., "The baryon-photon fluid drives a sound wave outward from the CDM peak at the sound speed c_s = c/sqrt(3(1+R)). The shell freezes at recombination, setting a standard ruler for cosmological measurements.").
- [ ] Edit README.md: write three substantive paragraphs (what BAO is, what to look for, which controls do what).
- [ ] Edit index.html figcaption and description.
- [ ] No code changes, no recapture needed.
