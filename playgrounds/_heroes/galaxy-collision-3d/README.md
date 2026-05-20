# Galaxy Collision

Two model disk galaxies pass close under gravity. Forces are computed
every step by the shared 2D Barnes-Hut quadtree (O(N log N)). Prograde-
prograde geometry pulls long tidal tails out of each disk (the Toomre
antennae).

Cores: heavy point masses standing in for the bulge + dark halo.
Disks: exponential rotating disks of test stars (200 to 2000 each).
Integrator: leapfrog kick-drift-kick.

Engine: shared/js/engine/quadtree-2d.js. Reference: Toomre and Toomre,
ApJ 178 (1972) 623.
