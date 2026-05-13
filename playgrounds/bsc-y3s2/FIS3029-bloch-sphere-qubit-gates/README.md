# Bloch Sphere Qubit Gates

A single qubit on the Bloch sphere. Apply standard gates (X, Y, Z, H, S, T) or continuous rotations (R_x, R_y, R_z by the slider angle). The red arrow is the live state vector; the blue trail shows the recent path; the readout reports the live (theta, phi) angles, the Bloch components (r_x, r_y, r_z), the norm (should equal 1), the unitarity of the most recent gate (should be machine zero), and a short history of applied gates.

Try H -> X -> H to see the bit-flip become a phase-flip up to a global phase. R_z(2 pi) returns the Bloch vector to its starting point but multiplies the state vector by -1 (a global phase that's invisible to single-qubit measurements but matters in interference).

## Reference

Sakurai-Napolitano, "Modern Quantum Mechanics", 3rd ed., Section 1.2 (Kets, bras, and operators); Nielsen-Chuang, "Quantum Computation and Quantum Information", 10th Anniversary ed., Section 4.2 (Single qubit operations). Both verified in chapter_index.

## Verification

- Every standard gate and arbitrary R_x, R_y, R_z rotation passes the unitarity check ||U^dagger U - I||_F < 1e-12.
- H |0> sends the Bloch vector to +x within 1e-9.
- X X = I (involution).
- Z flips the phase of the |1> amplitude.
- R_z(2 pi) leaves the Bloch vector unchanged but the spinor picks up a -1 global phase.
- blochToAmps and ampsToBloch round-trip the angles to 1e-10.
