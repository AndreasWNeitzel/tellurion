# Eddy-current braking

Drop two metal plates through a magnet and one falls in slow motion while the other drops almost normally; the only difference is a few slots cut in the second. As a solid plate crosses the field its flux changes, and Faraday's law drives swirling loops of current inside the metal, the eddy currents; by Lenz's law their force opposes the motion, so the plate is braked with a drag F = (A^2/R) B'(y)^2 v that grows with speed, with the square of the field gradient, and with the conductivity (small resistance). Cut slots and you break the current loops, raise the resistance, and switch the brake almost off. The top panel races a solid and a slotted plate through the same field band with their eddy loops drawn; the bottom panel plots both speeds against time.

Watch the solid plate (blue) stall as it enters the band while the slotted plate (green) keeps accelerating like free fall. Turn the field up and the solid plate brakes harder (the drag scales as the field squared) and falls further behind; turn the field to zero and the two plates drop together, the proof that the brake is purely magnetic. The eddy loops glow brightest at the edges of the band, where the field gradient is steepest, and fade at the flat centre where the flux is momentarily not changing. This is the eddy-current brake of trains and roller coasters, and the damping in sensitive laboratory balances.

The field slider sets the magnet strength; Drop again relaunches both plates; Pause freezes them. The motion is a closed-form linear-drag fall, so the energy balance (gravity work equals kinetic energy plus eddy heat) holds exactly.

## Reference

Halliday, Resnick and Walker, *Fundamentals of Physics*, Ch. 30 (eddy currents); Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 7.1-7.2.

## Verification

- Strong invariants: gravitational work equals kinetic energy plus eddy heat; over the same drop the solid plate exits slower and dissipates more heat; the eddy drag vanishes where the field is flat.
- Visual gate: SSIM against committed golden frames at both folds.
