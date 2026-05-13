# Kepler Solar System Explorer

A central mass at the origin (yellow disc), four inner Solar System planets at their real semi-major axes and eccentricities (Mercury through Mars), plus a user-controllable fifth test orbit. All five bodies obey the same inverse-square law in GM = 1 units where a = 1 AU corresponds to Earth's orbit (1 yr per revolution by Kepler's III law).

The inset (top-right) plots log(T^2 / 4 pi^2) versus log(a^3) for every body. They all land on the dashed line of slope 1, which is Kepler's third law: T^2 proportional to a^3 regardless of eccentricity. Adjust the test orbit's (a, e) and watch its data point slide along the line.

The animation runs in real time: the speed slider sets the year-per-second rate (default 1 yr/sec; Mercury then completes a full orbit every ~ 0.24 sec on screen, Mars every ~ 1.88 sec). The test orbit can stretch out to a = 2.5, e = 0.6 for a comet-like trajectory.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 8.12 "Orbit of the Earth". Bib key `newman2013`, chapter_index lists Section 8.12.

## Verification

- Strong invariants: per-body Kepler's III law (T = 2 pi a^(3/2) in GM = 1 units); eccentricity recovered from state to 1e-8; semi-major axis recovered to 1e-8; Earth orbit returns within 2 percent of IC after one period.
- Long-term integration: all five bodies stay bound over 1 yr (radius < 2 a_apastron).
- Reproducibility: bit-identical positions after 1000 steps.
- Visual gate: SSIM > 0.92 across 5 frames spanning t = 0 to t = 2 yr.
- Last verified: see `.verified`.
