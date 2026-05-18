# CT Reconstruction: Radon, Filtered Back-Projection and MLEM

This is how a CT scanner turns X-ray shadows into a slice through the body. The scanner measures line integrals of the tissue attenuation at hundreds of angles; stacked together these form the sinogram, which is the Radon transform of the image. Recovering the image from the sinogram is the inverse problem solved here two ways: filtered back-projection, the analytic method used in clinical CT, which applies a ramp filter and smears each projection back across the field; and MLEM, the iterative maximum-likelihood method used in PET and SPECT. The test object is the standard Shepp-Logan head phantom.

What to look for: with only five projection angles the filtered back-projection is a star-burst of streaks and the phantom is barely visible; push the angle slider up and the streaks fill in until the image is sharp. Turn the filter off and back-projection alone gives a hopelessly blurred blob, which is why the ramp filter matters. Switch to MLEM and watch the second curve in the error panel fall monotonically, the reconstruction improving with every iteration rather than every angle.

Controls: the angle slider sets how many projections the gantry takes (the dominant control for image quality); the filter selector switches between the Ram-Lak ramp, the Shepp-Logan apodisation and no filter; the method selector switches between filtered back-projection and iterative MLEM. Reset restores ninety-angle Ram-Lak FBP; Pause freezes the gantry sweep, which is an acquisition animation only.

## Reference

Primary citation: Kak and Slaney, Principles of Computerized Tomographic Imaging (1988); Shepp and Vardi, IEEE TMI 1, 113 (1982).

## Verification

- Strong invariant: the Radon transform is linear (1e-9); FBP of a point source peaks exactly at the source; MLEM error decreases monotonically.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
