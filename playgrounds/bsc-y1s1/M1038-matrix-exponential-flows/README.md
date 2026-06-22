# The matrix exponential as a flow

The linear system $\dot{\mathbf{x}} = A\mathbf{x}$ has one clean solution, $\mathbf{x}(t) = e^{At}\mathbf{x}_0$, and the matrix exponential is the operator that slides every starting point forward in time at once, the flow of the system. What that flow looks like is decided entirely by the eigenvalues of $A$. Two real eigenvalues of the same sign make a node, points racing straight out from the origin or straight in; opposite signs make a saddle, drawn in along one eigendirection and flung out along the other; a complex pair makes a spiral, winding in if the real part is negative and out if it is positive; and a purely imaginary pair makes a centre, closed loops that neither grow nor decay. The scene draws the phase portrait with streamlines and a cloud of markers actually flowing along $e^{At}$, with the orange dashed lines marking the real eigenvector directions the flow can never leave. Drag the green initial point and the white dot rides its trajectory, the exact $e^{At}\mathbf{x}_0$.

The bottom panel is the deciding diagram: the two eigenvalues plotted in the complex plane, stable to the left of the imaginary axis and unstable to the right, real on the axis and complex off it. A node has both eigenvalues on the real axis on one side; a saddle straddles the imaginary axis; a spiral sits as a conjugate pair off the real axis; a centre sits exactly on the imaginary axis. The classification printed there is read straight off those positions.

Next system cycles the six canonical portraits, and watching the eigenvalue pair move shows how a small change of $A$ that carries them across a boundary flips the entire character of the flow, from spiralling in to spiralling out, or from a closed centre to a decaying focus.

## Reference

Strang, *Introduction to Linear Algebra*, 5th ed., Sec. 6.3 (systems of differential equations); Hirsch, Smale, Devaney, *Differential Equations, Dynamical Systems, and an Introduction to Chaos*, Ch. 3-4.

## Verification

- Strong invariants: $e^{A\cdot 0} = I$; the flow solves $\dot{\mathbf{x}} = A\mathbf{x}$ and the closed-form exponential matches RK4 integration across all six systems; the eigenvalues classify the fixed point, and real eigenvectors satisfy $A\mathbf{v} = \lambda\mathbf{v}$.
- Visual gate: SSIM against committed golden frames at both folds.
