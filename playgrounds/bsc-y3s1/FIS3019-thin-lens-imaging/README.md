# Thin-lens imaging

A thin lens collects the rays leaving one point of an object and bends them so they meet again at one point of the image. Three of those rays are drawable by hand: a ray parallel to the axis leaves through the far focal point, a ray through the centre of the lens goes straight on, and a ray through the near focal point leaves parallel to the axis. Where they cross is the image, set by the Gaussian lens equation $1/d_o + 1/d_i = 1/f$ with magnification $M = -d_i/d_o$. The scene traces all three rays from a draggable object and streams photons along their physical paths so the direction of light is unambiguous.

Drag the object along the axis and watch the image respond. For a converging lens the image is real and inverted while the object is beyond the focal point, passing through the same-size case ($M=-1$) exactly at $d_o=2f$. Bring the object inside the focal length and the refracted rays diverge: the image jumps to the near side of the lens, upright and enlarged, the way a magnifying glass works, drawn dashed because only the backward extensions of the rays meet there. A diverging lens ($f<0$) always returns a small upright virtual image. Right at $d_o=f$ the refracted rays come out parallel and the image runs off to infinity.

The lower panel plots the image distance and the magnification against object distance. Both diverge at $d_o=f$: the image distance is a hyperbola that swings from $-\infty$ to $+\infty$ as the object crosses the focal point, and the sign change is exactly the real-to-virtual transition you see in the scene. The dot tracks the current object position on both curves.

## Reference

Hecht, *Optics*, 5th ed., Pearson, 2017, Ch. 5 (Geometrical Optics), Eq. 5.17; Born and Wolf, *Principles of Optics*, 7th ed., Ch. 4.

## Verification

- Strong invariants: the three principal rays satisfy $1/d_o+1/d_i=1/f$ to 1e-9; the magnification equals $-d_i/d_o$; the object at $2f$ images at $2f$ with $M=-1$; a diverging lens gives $0<M<1$ for every object distance.
- Visual gate: SSIM against committed golden frames at both folds.
