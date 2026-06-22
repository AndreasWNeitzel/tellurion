# Reel script: Lennard-Jones Molecular Dynamics

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Watch a cold dense lattice of Lennard-Jones disks melt into a liquid, the radial distribution function growing its first peak while velocity-Verlet holds the energy flat.
Caption: Watch a cold dense lattice of Lennard-Jon…

## Beat 2, the reveal (3 to 10s)
VO: 300 disks in a periodic box interacting through the Lennard-Jones potential U(r)=4ε[(σ/r)12−(σ/r)6]U(r)=4\varepsilon[(\sigma/r)^{12}-(\sigma/r)^{6}]U(r)=4ε[(σ/r)12−(σ/r)6] (reduced units σ=ε=m=kB=1\sigma=\varepsilon=m=k_B=1σ=ε=m=kB​=1), integrated by velocity-Verlet (the verified shared symplectic engine) with a shifted-force cutoff so energy is conserved.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Particles are coloured by kinetic energy. The temperature is read from the kinetic energy by equipartition, the pressure from the virial, and the structure from the radial distribution g(r)g(r)g(r): a flat g(r)→1g(r)\to1g(r)→1 for a gas, a strong first peak near r=21/6σr=2^{1/6}\sigmar=21/6σ for a dense liquid.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Set it cold and dense and it freezes into a triangular lattice; heat it and it melts.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Watch a cold dense lattice of Lennard-Jon…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
frenkel-smit
