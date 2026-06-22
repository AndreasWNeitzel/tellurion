# Reel script: The Determinant as Area Scaling

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: The determinant of a 2x2 matrix is the signed area of the parallelogram its columns span.
Caption: The determinant of a 2x2 matrix is the si…

## Beat 2, the reveal (3 to 10s)
VO: The determinant of a matrix has a simple geometric meaning: it is the factor by which the linear map scales areas (in two dimensions) or volumes (in three).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: A $2\times 2$ matrix with columns $\mathbf{v}_1$ and $\mathbf{v}_2$ sends the unit square to the parallelogram those two vectors span, and its determinant $\det = ad - bc$ is exactly the signed area of that parallelogram, equal to $|\mathbf{v}_1||\mathbf{v}_2|\sin\theta$ for the angle $\theta$ between the columns. The sign carries the orientation: positive when the second column is counterclockwise from the first, negative when the map flips the plane over (a reflection), and zero when the two columns lie along the same line and the parallelogram collapses to a segment of no area, which is exactly when the matrix is singular and not invertible.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag the green column $\mathbf{v}_1$ or the gold column $\mathbf{v}_2$: the parallelogram and the determinant follow, and the readout shows the area $|\det|$.
VO: Swing $\mathbf{v}_2$ clockwise past $\mathbf{v}_1$ (or pick the reflection preset): the fill flips from blue to red, the F motif comes out mirrored, and the determinant goes negative (the map reverses orientation).
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: This single number, the area or volume scaling, is what the Jacobian determinant measures locally for any smooth map.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- The determinant of a 2x2 matrix is the si…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Strang, Linear Algebra and its Applications, Ch.
