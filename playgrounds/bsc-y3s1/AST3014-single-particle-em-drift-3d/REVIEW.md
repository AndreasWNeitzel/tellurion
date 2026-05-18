# REVIEW - single-particle-em-drift-3d (deep audit; supersedes any earlier pass)

## Verdict
NEEDS CODE FIX + RECAPTURE

## A. Scientific validity

Physics faithful to Chen (1984) Ch. 2: Lorentz force m dv/dt = q(E + v x B), cyclotron frequency omega_c = qB/m, E x B drift v_d = E x B / B^2, grad-B drift v_gradB = (m v_perp^2 / 2qB^3) B x gradB, adiabatic invariant mu = m v_perp^2 / 2B all correct per references.

Boris pusher correctly implements time-reversible leapfrog conserving |v| to 1e-9 in pure B (verified in invariants.test.mjs).

Magnetic mirror field is paraxial divergence-free (B_z and B_r components; spec.md lines 54-57 correctly state the form).

## B. Physics & numerical robustness

**Capture pipeline partially broken:** The playground reads captureFraction and advances the simulation correctly (playground.js lines 141-144). However, the frame progression shows a defect: t-050 (80K), t-075 (80K), t-100 (80K) are byte-identical (same MD5 hash). This occurs because the cyclotron orbit completes its cycle or the persistence-fade trail converges to a visually identical state.

**Frame progression:** t-000 (50K) and t-025 (77K) show increasing trail length and helix development. t-050-100 are identical, suggesting the trail reaches full screen coverage or the gyration repeats exactly (360 steps = one full period for omega_c = 1 rad/unit and t_capture_span = 360).

**Physics check:** For preset cyclotron (E=0, B=[0,0,1]), the period is T_c = 2*pi ≈ 6.28 time units. At 360 steps, the particle has completed ~57 orbits. The trail persistence should continue to grow visually (older particles fade). The fact that frames t-050-100 are identical suggests either (a) the trail mask reaches saturation (no visual change), or (b) the capture logic hits a period (capture at steps 270 = 270/6.28 ≈ 43 periods, and 360/6.28 ≈ 57 periods; both are integer periods modulo trail-rendering artifacts).

**Acceptable behavior if intentional:** If the cyclotron period divides evenly into the capture span (360 steps), and the trail persistence saturates, then visually identical frames at high-percentage times are acceptable. However, this must be documented.

## C. Presentability

**Spec.md:** Excellent, comprehensive spec with physics, numerical method, controls, invariants, and citations.

**README.md:** Well-written, three paragraphs, covers setup, what to look for, and controls.

**index.html:** Contains inline bib keys in backticks ("(`chen1984`)", etc.). These should be removed or moved to figcaption under a "Source:" label.

## Hero-candidate
NO. Pedagogical single-particle orbital visualization.

## Action checklist for maintainer

- [ ] **Assess frame identity:** Determine whether t-050, t-075, t-100 being identical is due to (a) cyclotron period aliasing (acceptable if documented), or (b) a trail-persistence rendering saturating (acceptable but suboptimal for frame distinctness). If the frame progression is intentional, document it in spec under "Visual fallback".
- [ ] **If optimization is desired:** Consider increasing the capture span (e.g., 720 steps instead of 360) to ensure at least 5 visually distinct frames. Or reduce trail persistence to avoid saturation.
- [ ] **Remove inline bib keys from index.html:** Replace "Chen 1984 (`chen1984`)" with plain "Chen 1984" (remove backticks and key); move full citations to figcaption under "Source:".
- [ ] **Recapture frames** only if capture span or trail parameters change.


