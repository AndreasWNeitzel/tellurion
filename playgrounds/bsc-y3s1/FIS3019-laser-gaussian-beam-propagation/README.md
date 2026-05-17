# Gaussian Beam: ABCD Propagation

A laser beam is not a ray and not a plane wave; it is a Gaussian
whose width breathes as it travels. The elegant trick of Gaussian
optics is that all of that, the spot size and the wavefront
curvature, is packed into one complex number, the beam parameter q.
Every lens, mirror, or gap acts on q by the same 2x2 ray-transfer
matrix that geometric optics uses for rays. This bench shows the
beam envelope as q is propagated from a movable object (the input
waist) through a lens, with the transverse spot drawn at the object
and at the focus so you can watch it tighten or widen.

What to look for: the two disks at the top right are the beam cross
section at the object and at the focus, on one shared scale. Add a
short focal length and the focused disk collapses far below the
object disk, the label flips to "focused Nx tighter", and the
envelope snaps to a tight waist; the readout checks it against the
textbook limit lambda f over pi w. Lengthen f and the focus fattens
past the object ("Nx wider"). Drag the object marker along the axis
and watch the focus track it (Gaussian imaging); drag the lens and
the whole downstream beam follows. Change the wavelength and the
diffraction limit scales with it.

Controls: input waist and wavelength set the launched beam; focal
length sets the lens strength; the object-z0 slider and the
lens-position slider (or dragging the nearer of the two on the
canvas) move them along the bench; Reset restores the Nd:YAG
defaults.

## Reference

Primary citation: Siegman, *Lasers* (1986), Ch. 17 and 19
(`siegman1986`); Hecht, *Optics* (5th ed.), Ch. 13 (`hecht2017`).

## Verification

- Strong invariant: free space gives q = q0 + z and the exact
  spot-size law to 1e-12; a collimated beam focuses to lambda f /
  (pi w0) within 0.5 percent; ABCD matrices compose exactly; the
  Gouy phase is pi across a focus; and a two-mirror cavity has a
  self-consistent Gaussian mode if and only if it is stable.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
