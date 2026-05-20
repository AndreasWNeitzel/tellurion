# BEC Vortex Lattice in a Rotating Trap (Hero)

A 2D Bose-Einstein condensate in a harmonic trap, rotated at angular
frequency $\Omega$. To carry angular momentum the condensate cannot
rotate smoothly, so it threads itself with quantized vortices on an
Abrikosov triangular lattice. Each black core is one vortex carrying
$\oint \vec v_s \cdot d\vec\ell = h/m$ of circulation. The lattice
density obeys Feynman's $n_v = m\Omega/(\pi\hbar)$.

## What to look for

The cyan-magenta-yellow cloud is the Thomas-Fermi condensate density
$n(\vec r) = (\mu - V(\vec r))/g$, an inverted parabola of radius
$R_{\rm TF}$. Black dots are vortex cores where the wave function
vanishes; the colored hue rings around each are the $2\pi$ phase
winding. The lattice rotates as solid-body about the trap axis,
fixed by the Feynman vortex density.

## Controls

Crank the rotation rate $\Omega/\omega_{\rm trap}$ from 0 up to 0.92
(above 1 the trap is centrifugally unbound) and watch the lattice
fill: 1 then 7 then 19 then 37 then 61, the magic shell-filling
numbers. The interaction slider $N a_s / a_{\rm ho}$ tunes the cloud
size $R_{\rm TF} \propto (N a_s)^{1/5}$. The phase-overlay slider
brightens the hue rings around each vortex. Resolution controls the
density-grid sampling.

## Source

Pitaevskii and Stringari, *Bose-Einstein Condensation and Superfluidity*,
OUP 2016, Sections 11.4 to 11.6. Pethick and Smith, *Bose-Einstein
Condensation in Dilute Gases*, 2nd ed. CUP 2008, Chapter 9. Review:
Cooper, *Adv. Phys.* 57 (2008) 539.
