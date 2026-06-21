# The double slit and which-path

The double-slit experiment is the one Feynman called the heart of quantum mechanics, the phenomenon that holds the only mystery. Fire particles, electrons or photons, one at a time at a barrier with two slits, and each one strikes the far screen as a single localized dot, exactly as a particle should. Yet let thousands of them arrive and the dots do not spread into two simple piles behind the slits; they organize into a pattern of bright and dark bands, an interference pattern, as if each particle somehow passed through both slits and interfered with itself. The intensity is the single-slit diffraction envelope multiplied by the two-slit fringes, and the bands are spaced by $\lambda L/d$. The top panel builds the pattern dot by dot so you can watch order emerge from individual random hits; the bottom panel plots the intensity profile with the running histogram of detections.

The deeper lesson is complementarity. The interference depends on not knowing which slit each particle went through. Install a detector at the slits that records the path, and the fringes wash out, leaving only the smooth single-slit hump, the same pattern you would get by blocking one slit at a time and adding the results. You cannot have the which-path knowledge and the interference at once, and the trade is exact: the fringe visibility $V$ and the path distinguishability $D$ satisfy $V^2 + D^2 = 1$. Slide the which-path knob from zero and watch the bands fade in step with the shrinking green visibility bar, the system riding precisely along that circle, partial knowledge buying partial fringes. Widen the slits or shorten the wavelength and the surviving fringes crowd closer together.

The slit-separation and wavelength sliders shape the pattern, the which-path slider sets how much path information is acquired, and Reset clears the screen. Each detection is drawn by sampling the quantum intensity, so the buildup is genuinely statistical, not scripted.

## Reference

Feynman, Leighton and Sands, *The Feynman Lectures on Physics*, Vol. III, Ch. 1; Englert 1996, Phys. Rev. Lett. 77, 2154 (the fringe-visibility duality relation).

## Verification

- Strong invariants: the visibility and distinguishability obey $V^2 + D^2 = 1$; the bright fringes are at $\alpha = k\pi$ with spacing $\lambda L/d$; full which-path information leaves the smooth single-slit envelope with no fringe zeros.
- Visual gate: SSIM against committed golden frames at both folds.
