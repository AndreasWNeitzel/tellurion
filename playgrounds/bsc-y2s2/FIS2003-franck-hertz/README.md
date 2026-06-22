# The Franck-Hertz experiment

In 1914 Franck and Hertz fired electrons through mercury vapour and found that the atoms would only take energy from them in one exact amount, the clearest early proof that atomic energy comes in discrete levels. The setup is simple: electrons leave the cathode, accelerate across the tube through a voltage, and are collected past a small retarding gap that only lets through electrons still carrying some energy. As long as an electron has less than the excitation energy $E_\text{exc}$ it sails through every atom elastically, losing nothing, and the collector current climbs with the voltage. But the moment its kinetic energy reaches $E_\text{exc}$ it can collide inelastically, hand exactly that lump to an atom, and drop to nearly zero, too slow to clear the retarder, so the current suddenly falls.

Push the voltage higher and the electron can re-accelerate and excite a second atom, then a third, and the current dips again and again, evenly spaced by $E_\text{exc}/e$ in voltage. The top panel shows it happening: electrons speed up across the tube, and wherever their energy crosses a multiple of $E_\text{exc}$ they light up a luminous layer of excited atoms, one more layer appearing with each extra step of voltage. The bottom panel is the measurement itself, the collector current against accelerating voltage, rising overall but notched at every multiple of the excitation energy, with the spacing of the notches marked.

That spacing, read straight off the curve, is the excitation energy, no spectroscopy required. Slide the voltage to walk along the curve and watch the layers appear; change $E_\text{exc}$ and the whole pattern, layers and dips alike, re-spaces to match the one energy that sets it.

## Reference

Franck and Hertz 1914, Verh. Dtsch. Phys. Ges. 16, 457; Eisberg and Resnick, *Quantum Physics*, 2nd ed., Sec. 4.6.

## Verification

- Strong invariants: the current dips are spaced by $E_\text{exc}/e$; the number of luminous layers is $\lfloor V/E_\text{exc}\rfloor$; the pass fraction is low just above each multiple (electrons just excited, too slow) and high mid-interval, the periodic structure underlying the dips.
- Visual gate: SSIM against committed golden frames at both folds.
