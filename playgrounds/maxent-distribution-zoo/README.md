# Maximum-entropy distributions: a small zoo

Tell the maxent principle what summary statistics you know (the support, the mean, the variance) and it picks the unique probability density that uses no more structure than those statistics force. Four canonical cases on the same axis: uniform (just a support), exponential (mean), Gaussian (mean + variance), Laplace (mean + mean absolute deviation).

What to look for: the entropy values match the closed-form table (Cover and Thomas 12.1) and the trapezoidal numerical integral matches the closed form to a few percent. Slide sigma on the Gaussian and watch h = 0.5 ln(2 pi e sigma^2) climb linearly in ln sigma.

Controls: pick a family from the dropdown; the relevant sliders appear. mu sets location (gaussian, laplace), the second slider sets scale, the support slider applies only to uniform.

## Reference

MacKay 2003, Information Theory, Inference, and Learning Algorithms, Section 22.2; Cover and Thomas 2006, Elements of Information Theory, 2e, Section 12.1; Jaynes 1957, Phys. Rev. 106.

## Verification

- Strong invariants: closed-form entropies, numeric vs analytic agreement, normalization.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
