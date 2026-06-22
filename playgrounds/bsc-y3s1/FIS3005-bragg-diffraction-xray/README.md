# X-ray Bragg diffraction

When the wavelength of light is comparable to the spacing between atoms, a crystal stops behaving like a smooth mirror and starts behaving like a ruler. Send a beam of X-rays in and at almost every angle nothing much comes back, but at a handful of sharp angles a bright reflected beam flashes out. William and Lawrence Bragg explained it in 1913 with a picture you can draw by hand. Think of the crystal as a stack of evenly spaced planes of atoms, each one reflecting a faint echo of the incoming wave. A ray bouncing off the second plane has to travel a little farther than one bouncing off the first, and a quick bit of geometry, dropping perpendiculars onto the deeper ray, shows the extra distance is exactly $2d\sin\theta$. The scene draws that construction: two planes, the incident and reflected rays, and the two yellow segments that add up to the path difference.

Everything turns on whether that extra path is a whole number of wavelengths. If it is, the echoes from every plane in the stack arrive crest-on-crest and reinforce; if it is not, they arrive scrambled and cancel. The single condition $n\lambda = 2d\sin\theta$ captures it, and as you sweep the glancing angle the reflected beam in the scene flares bright exactly when the path-difference label passes $1\lambda$, $2\lambda$, $3\lambda$, the successive orders. Between those angles the beam goes dark.

The lower panel is what a diffractometer actually records: reflected intensity against angle. It is a flat dark line broken by a few needle-sharp peaks, one per order, sitting at $\theta_n=\arcsin(n\lambda/2d)$. The peaks are sharp because the contributions of many planes only survive when they are all in phase, so a tiny change in angle kills the signal. Widen the plane spacing and the peaks slide to smaller angles and multiply; stretch the wavelength past twice the spacing and they disappear entirely, since no angle can make $\sin\theta$ exceed one. That inverse link between spacing and angle is exactly what lets crystallographers run the logic backward and turn a pattern of spots into the positions of atoms.

## Reference

Ashcroft and Mermin, *Solid State Physics*, Holt-Saunders, 1976, Ch. 6; Kittel, *Introduction to Solid State Physics*, 8th ed., Ch. 2.

## Verification

- Strong invariants: at every peak the path difference equals $n\lambda$ (to 1e-9); the reflected intensity is 1 at the Bragg angles and falls below 0.1 between the first two; the number of visible orders is $\lfloor 2d/\lambda\rfloor$; no peak exists when $\lambda>2d$.
- Visual gate: SSIM against committed golden frames at both folds.
