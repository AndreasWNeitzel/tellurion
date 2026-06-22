# Rutherford scattering

In 1909 a few alpha particles fired at a thin gold foil bounced almost straight back, which Rutherford called as incredible as a shell rebounding off tissue paper. A diffuse cloud of charge could never do that; only a tiny, dense, charged nucleus could turn a fast alpha around, and that one observation moved the positive charge of the atom from a smear into a point. Each alpha follows a hyperbola in the nucleus's Coulomb field, and how sharply it bends is fixed by its impact parameter, the sideways miss-distance of its incoming line. Aim almost dead-on and the repulsion flings it back through a large angle; pass wide and it barely swerves. The top panel fires a beam at a spread of impact parameters and traces the orbits, the near-axis ones whipping around and the outer ones grazing past, with the alphas slowing as they climb the Coulomb hill near closest approach. The dashed circle is $D$, the closest a head-on alpha ever gets, larger for a heavier nucleus or a slower alpha; the deflection obeys $\cot(\theta/2) = 2b/D$.

The real triumph was statistical. Counting how many alphas scatter into each angle gives the differential cross section $d\sigma/d\Omega = (D/4)^2/\sin^4(\theta/2)$, the steep curve in the bottom panel, plotted on a log scale because it spans orders of magnitude. It is sharply forward-peaked, most alphas barely deflecting, but the large-angle tail falls off slowly and never quite vanishes, and that stubborn tail, the rare hard bounce, is the fingerprint of a point nucleus rather than a soft cloud.

The energy and charge sliders squeeze or stretch the orbits by changing $D$, and the impact-parameter slider picks one orbit to highlight in green, reading off its scattering angle and closest approach and marking where it sits on the cross-section curve. Slide it toward zero to watch a near-head-on alpha turn all the way around.

## Reference

Krane, *Introductory Nuclear Physics*, Sec. 11.2 (Rutherford scattering); Eisberg and Resnick, *Quantum Physics*, 2nd ed., Ch. 4.

## Verification

- Strong invariants: the deflection obeys $\cot(\theta/2) = 2b/D$; the differential cross section is $(D/4)^2/\sin^4(\theta/2)$ and forward-peaked; the velocity-Verlet Coulomb orbit reproduces the analytic deflection and closest approach.
- Visual gate: SSIM against committed golden frames at both folds.
