# MRI: the Bloch Equations, the FID and k-Space Imaging

Magnetic resonance imaging starts from a single vector. Spins in a strong field are tipped sideways by a radio pulse; the net magnetization then precesses about the field while its transverse part decays (T2) and its longitudinal part recovers (T1). Those two relaxation times, sampled with the right timing, are what make grey matter, white matter and cerebrospinal fluid look different. The measured signal is the decaying transverse magnetization (the free induction decay), and an image is the inverse Fourier transform of the spatial-frequency data the scanner collects, which is called k-space.

What to look for: on the Bloch sphere the magnetization spirals inward as the transverse signal decays, then climbs back up the axis as it recovers. Switch the weighting from T2 to T1 and watch the contrast invert, the fluid-filled ventricles go from bright to dark, exactly as in a real scan. Pull the k-space slider down and the image blurs and rings, because discarding the outer k-space lines discards the fine spatial detail. Spin echo and gradient echo use different signal equations, and the gradient echo uses its optimal Ernst flip angle.

Controls: the weighting selector sets TR and TE for T1, T2 or proton-density contrast; the sequence selector switches between spin echo and gradient echo; the k-space slider sets how much of k-space is acquired. Reset restores T2-weighted spin echo at full k-space; Pause freezes the Bloch precession and the FID sweep, which are animation only.

## Reference

Primary citation: Bloch, Nuclear Induction, Phys. Rev. 70, 460 (1946); Liang and Lauterbur, Principles of Magnetic Resonance Imaging (2000).

## Verification

- Strong invariant: pure precession conserves |M| to 1e-10; the 2D FFT is unitary to 1e-9; T1 and T2 weighting invert the CSF contrast.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
