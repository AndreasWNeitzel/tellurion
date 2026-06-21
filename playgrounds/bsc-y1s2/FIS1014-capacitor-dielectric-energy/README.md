# Capacitor with a dielectric: energy and the pull-in force

A parallel-plate capacitor stores charge $Q = CV$ with capacitance $C = \varepsilon_0 A/d$, and pushing a dielectric slab into the gap raises that capacitance: a material of dielectric constant $\varepsilon_r$ that covers a fraction $x$ of the plate area makes two capacitors in parallel, $C(x) = C_0[1 + (\varepsilon_r - 1)x]$, and more charge crowds onto the plates where the dielectric sits. The slab does not just sit there: the field at the plate edge pulls it in. Whether that lowers or raises the stored energy depends on what is held fixed, and the playground lets you switch between the two cases and watch the slab get sucked in either way. The top panel shows the plates and their free charge (denser under the dielectric), the slab and its bound surface charges, the field, and the inward force; the bottom panel plots the stored energy and the force against how far the slab is inserted.

Disconnect the battery (constant charge) and the energy $U = Q^2/2C$ falls as the slab enters, the field arrows shorten because the voltage $V = Q/C$ drops, and the energy released is exactly the work that pulls the slab in. Reconnect the battery (constant voltage) and the story inverts: $U = \tfrac12 CV^2$ now rises and the charge grows as the battery pushes more onto the plates, yet the force is still inward, because the battery, not the field, supplies the work. In both cases the dielectric is pulled fully into the capacitor, a small force whose sign is unambiguous. Raise the dielectric constant and the charge crowds more densely under the slab and the force grows.

The dielectric and voltage sliders set the material and the bias; Toggle battery switches between constant charge and constant voltage; Release lets the field pull the slab in and Slab out resets it, and you can drag the slab directly. The slab motion is a damped second-order step under the closed-form inward force.

## Reference

Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 4.4.4 (the force on a dielectric); Halliday, Resnick and Walker, *Fundamentals of Physics*, Ch. 25 (capacitance and dielectrics).

## Verification

- Strong invariants: the capacitance is $C_0[1 + (\varepsilon_r - 1)x]$; the slab is pulled in (the force is inward) in both modes; at constant charge the work pulling the slab in equals the energy released.
- Visual gate: SSIM against committed golden frames at both folds.
