# KL divergence asymmetry

A 1D bimodal target P (blue) and a single-Gaussian approximation Q (orange). Drag Q's mu and sigma; watch the two directions of KL divergence change. They have very different argmins on the same problem.

What to look for: minimizing D(P||Q) gives a Q that covers both modes of P, even where P has very little mass between them ("mass-covering"). Minimizing D(Q||P) gives a Q that collapses onto a single mode and ignores the other ("mode-seeking"). The "snap" buttons jump Q to each argmin so you can see them side by side.

Controls: Q's mu and sigma; the separation between P's two modes. Snap buttons jump to each argmin.

## Reference

MacKay 2003, Information Theory, Inference, and Learning Algorithms, Chapter 2 and Section 33.7; Bishop 2006, Pattern Recognition and Machine Learning, Section 10.1.

## Verification

- Strong invariants: D(P||P) = 0, non-negativity, D(N(0,1) || N(1,1)) = 0.5, asymmetry > 0.1 for typical configs, mass-covering sigma > mode-seeking sigma.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
