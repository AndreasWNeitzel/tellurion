# Double-Slit Single-Photon Accumulator

Each photon hits the screen at one point. Run the simulator long enough
and the interference fringes emerge from the histogram of hits. The
canonical demonstration that quantum mechanics is statistical: the
classical wave intensity sets the hit probability, but individual
detections are localized.

Slide d, a, and lambda to widen / narrow / shift the fringe pattern.
Reset clears the histogram to start a fresh accumulation.

Engine: Fraunhofer two-slit intensity, rejection-sampled photon hits,
1D histogram + closed-form intensity overlay.

Reference: Hecht, Optics, Ch. 10; Tonomura et al., Am. J. Phys. 57
(1989) 117 (single-electron demonstration).
