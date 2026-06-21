# The determinant as area scaling

The determinant of a matrix is usually introduced as a formula, $ad - bc$, but it has a vivid geometric meaning: it is the factor by which the linear map stretches areas, or in three dimensions volumes. A two-by-two matrix acts on the plane by sending the unit square to the parallelogram spanned by its two columns, and the determinant is precisely the signed area of that parallelogram, which also equals $|\mathbf{v}_1||\mathbf{v}_2|\sin\theta$ for the angle between the columns. The top panel warps the whole integer grid by the matrix so you can see every unit cell stretch by the same factor, highlights the image of the unit square, and draws the two columns; the bottom panel plots the signed area as the second column is swung around.

Drag the green column or the gold column and the parallelogram, the grid, and the determinant all move together; the readout shows the area as $|\det|$. The sign is the interesting part. While the second column stays counterclockwise from the first the determinant is positive and the parallelogram is filled blue, orientation preserved; swing it clockwise past the first and the shape turns inside out, the fill flips to red, and the determinant goes negative, the signature of a map that reflects the plane. Bring the two columns into line and the parallelogram collapses to a segment with no area at all: the determinant is zero and the matrix is singular, exactly the case where it has no inverse. The signed-area curve below is a clean sine that crosses zero at those collinear angles, and this same area-or-volume scaling, evaluated locally, is what the Jacobian determinant measures for a curved change of variables.

Next matrix cycles through a rotation and a shear (both area-preserving, determinant one), a scaling, a reflection (determinant minus one), and a singular matrix (determinant zero); Reset returns to a general matrix you can then drag.

## Reference

Strang, *Linear Algebra and its Applications*, Ch. 5 (determinants); Lay, *Linear Algebra and its Applications*, Sec. 3.3 (volume and linear transformations).

## Verification

- Strong invariants: the absolute determinant equals the shoelace area of the image of the unit square; the determinant equals $|\mathbf{v}_1||\mathbf{v}_2|\sin(\text{angle})$; the preset matrices return their known determinants.
- Visual gate: SSIM against committed golden frames at both folds.
