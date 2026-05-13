# Particle-mesh self-gravitating disk

1500 particles in a flat rotating disc, gravitating on each other through a 32x32 PM grid. Solve Poisson by FFT, interpolate gradients back to particles, leapfrog push. The simplest "galaxy" you can run.

What to look for: at t = 0 the particles are an exponential disc rotating with omega(r) ~ 1/r. After a few rotations, self-gravity seeds transient spiral arms; eventually the disc heats up and the structure dissolves.

Controls: disc R (scale radius), speed, reset, pause / play.

## Reference

Hockney and Eastwood 1988, Computer Simulation Using Particles, Chapters 5 - 7.

## Verification

- Strong invariants: mass exact, |Lz| drift < 30%, particles in domain, initial rotation.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
