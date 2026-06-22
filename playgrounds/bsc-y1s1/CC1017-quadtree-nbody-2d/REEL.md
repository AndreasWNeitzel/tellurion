# Reel script: Quadtree Collision Detection

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Doing the force sum for every pair of N bodies is O(N squared) and crushes a laptop at N ~ 10^4; the Barnes-Hut quadtree groups distant clusters into single centres of mass and drops it to O(N log N), watching the tree itself adapt to the moving particles.
Caption: Doing the force sum for every pair of N b…

## Beat 2, the reveal (3 to 10s)
VO: To find which of $N$ moving disks are touching, the obvious method checks every pair: $N(N-1)/2$ tests every step, an $O(N^2)$ cost that explodes as $N$ grows.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: A quadtree fixes it. The box is recursively split into four until each cell holds only a handful of disks, so each disk need only test the few others in its own and neighbouring cells.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Watch the quadtree subdivide finely where the disks crowd together and stay coarse in the empty gaps; it follows the disks every frame.
VO: Switch the method to all pairs (N²): the grid vanishes and the pair-check count jumps onto the brute-force parabola, far above the quadtree, especially at large N.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: the Barnes-Hut quadtree groups distant clusters into single centres of mass and drops it to O(N log N), watching the tree itself adapt to the moving particles.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Doing the force sum for every pair of N b…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
barnes-hut1986
