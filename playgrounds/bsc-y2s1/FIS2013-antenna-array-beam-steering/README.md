# Phased array beam steering

A line of $N$ antennas steers its beam by feed phase alone. The top panel is the polar power pattern $|AF(\theta)|^2$ with the $N$ elements on the baseline tinted by their excitation phase, the yellow commanded-beam direction, and any grating lobes flagged in red. The bottom panel is the same array factor in decibels, with the half-power beamwidth band and the peak side-lobe level marked.

The beam sweeps automatically: only the progressive phase taper $\beta$ changes, and the main lobe points to $\sin\theta_0=-\beta/(kd)$. Adding elements narrows the beam and lowers the side lobes; widening the spacing past $d=\lambda$ raises a full-strength grating lobe in an unwanted direction, which is why real arrays sit near $d=\lambda/2$.

Controls: N (number of elements), d/λ (spacing), and the steer angle (which drives the sweep and pauses it on input); Reset returns to an 8-element half-wavelength broadside array. Source: Balanis, *Antenna Theory* (2016), Ch. 6 (`balanis`).
