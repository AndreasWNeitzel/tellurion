# Rotation Curve Explorer

A top-down view of a model spiral galaxy and an inset rotation curve. Stars orbit at $\Omega(R) = v(R) / R$ for the active model. The yellow five-pointed star marks the Sun at $R = 8$ kpc; the dashed ring is the solar circle. Four rotation-curve models share the visible matter (Hernquist bulge plus Miyamoto-Nagai disk) but differ in the unseen mass and in the radial dependence of $v(R)$:

1. **Rigid-body** ($v \propto R$, so $\Omega$ is constant): the only law that does NOT wind a material spiral. Pedagogical reference, not a physical model of any real galaxy.
2. **Keplerian (point mass)**: all visible mass concentrated at the centre. Outer rotation $v \propto R^{-1/2}$.
3. **Visible matter only**: bulge plus disk, no halo. Outer rotation declines moderately.
4. **Visible + dark matter**: bulge plus disk plus an NFW halo. Outer rotation is flat at $\sim 200$ km/s, matching the data.

The synthetic observation set was drawn from model 4 (the truth) with 6 km/s Gaussian noise. Watch the Sun and the spiral arm pattern. Under rigid-body rotation, the arms stay put. Under the three real models the arms wind up: this is the **winding problem**. Differential rotation destroys any static spiral pattern in a few orbital periods. The fact that real galaxies show stable arms tells us those arms are NOT material features. They are density waves (Lin and Shu 1964), which is outside the scope of this playground.

Look at the inset rotation curve while switching models. Only the dark-matter curve threads through the data points at $R > 10$ kpc.

Controls: select a rotation-curve model (radio buttons), pause or resume, reset time to zero.

## Reference

Primary citation: Binney and Tremaine, "Galactic Dynamics", 2nd ed., Sections 2.1 (Spherical systems), 2.2 (Potential theory of axisymmetric systems), 2.3 (Potential-density pairs for flattened systems). Bib key `binneytremaine2008`, chapter_index verified.

## Verification

- Strong invariants:
  - DM model reduced chi^2 < 2 against its own synthetic observations.
  - Keplerian chi^2 > 50x DM chi^2; visible-only chi^2 > 20x DM chi^2.
  - Rigid-body $\Omega(R)$ independent of $R$; an initial spoke remains a spoke after one period.
  - DM model differential rotation: an initial spoke winds by more than $\pi / 6$ between $R = 5$ and $R = 25$ in 0.3 Gyr.
  - Galaxy tracer radii preserved to better than 1e-9 kpc under any model (circular orbits).
  - DM model v(R) flat to within 35 km/s over [8, 28] kpc.
- Visual gate: SSIM > 0.92 against committed golden frames showing a time sweep at the DM model.
- Last verified: see `.verified`.
