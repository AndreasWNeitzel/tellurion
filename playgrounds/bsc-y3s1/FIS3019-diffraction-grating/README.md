# The diffraction grating

A grating is a comb of many fine slits, and shining light through it sharpens the gentle fringes of two slits into a row of needle-thin bright orders, the basis of nearly every spectrometer. The intensity is a product of two patterns: the broad single-slit envelope $(\sin\beta/\beta)^2$ set by each slit's own width, multiplied by the many-slit interference factor that spikes wherever all $N$ slits radiate exactly in phase. That happens at the grating equation $d\sin\theta = m\lambda$, the principal maxima, the same condition as two slits but now reinforced by $N$ of them. The scene paints the pattern as you would see it on a screen, a strip of coloured orders above the intensity profile and its orange envelope, the orders labelled, with a draggable cursor that reads the diffraction angle and intensity off any point.

The new magic is in the sharpness. Between each pair of orders the interference factor passes through $N-1$ perfect zeros and $N-2$ feeble secondary maxima, so the more slits you add the narrower each principal peak becomes, its width shrinking like $1/N$. The bottom panel zooms into the first order so you can count the secondary maxima and watch the peak knife in as $N$ rises. That narrowing is the resolving power $R = mN$, the reason a grating with thousands of lines can split spectral lines a prism would only smear together.

Slide the slit count and watch the orders sharpen, the spacing and watch them crowd or spread, the wavelength and watch each order shift to a new angle, the dispersion that turns a grating into a spectrometer. Where the orange envelope dips to zero, an order is dimmed or extinguished even though the grating would otherwise put a bright peak there.

## Reference

Hecht, *Optics*, 5th ed., Sec. 10.2.7 (the diffraction grating); Born and Wolf, *Principles of Optics*, 7th ed., Sec. 8.6.

## Verification

- Strong invariants: principal maxima sit at the grating equation $d\sin\theta = m\lambda$; between adjacent orders there are $N-1$ zeros and $N-2$ secondary maxima; the principal-peak width shrinks as $1/N$, giving the resolving power $R = mN$.
- Visual gate: SSIM against committed golden frames at both folds.
