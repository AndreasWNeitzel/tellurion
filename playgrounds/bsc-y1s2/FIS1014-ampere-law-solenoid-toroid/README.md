# Ampere's law: wire, solenoid, toroid

When a current arrangement is symmetric enough, you do not have to sum the Biot-Savart contributions: Ampere's law gives the field directly. The closed line integral of B around any loop equals mu0 times the current it encircles. Pick a loop on which B is constant and parallel, and the integral becomes B times the loop length, so B drops straight out. The top panel shows the geometry, the field and a draggable Amperian loop; the bottom panel plots the field magnitude versus distance.

A circular loop around a straight wire gives B = mu0 I / (2 pi r), falling as 1/r. A rectangular loop straddling a solenoid wall, one leg inside and one in the field-free outside, gives the uniform interior B = mu0 n I. A circular loop inside a toroid encircles all N turns and gives B = mu0 N I / (2 pi r). In every case the readout shows the circulation equal to the enclosed current, even as you drag the loop: for the wire B falls as 1/r but the loop length grows as r to compensate; for the toroid a loop in the central hole or outside the windings encloses nothing and reads zero.

Choose the geometry, set the current, and drag the loop (its radius for the wire and toroid, its length for the solenoid). Everything is closed-form, so the field laws and the Ampere's-law check are exact.

## Reference

Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 5.3; Young and Freedman, *University Physics*, 14th ed., Ch. 28.

## Verification

- Strong invariants: the closed line integral of B equals mu0 times the enclosed current in all three cases and at any loop size; the wire field falls as 1/r; a toroid loop in the hole or outside encloses no current.
- Visual gate: SSIM against committed golden frames at both folds.
