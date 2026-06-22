# The Carnot cycle

The Carnot cycle is the benchmark every heat engine is measured against: four reversible steps that extract the most work the second law permits from a temperature difference. The gas expands isothermally against a hot reservoir at $T_h$ and absorbs heat $Q_h$; it expands adiabatically and cools to $T_c$; it is compressed isothermally against a cold reservoir and rejects heat $Q_c$; and it is compressed adiabatically back to the start. On the pressure-volume plane the four legs trace a closed loop, and the area inside it is the net work $W$ done per cycle. The scene runs this in real time, with a working point circling the loop and a piston-cylinder whose width is the volume and whose colour is the temperature, hot red to cold blue, while a bar beneath it shows which reservoir the gas is touching.

Heat enters only on the hot isotherm and leaves only on the cold one; the two adiabats are insulated, so the gas changes temperature with no heat flow. That is the whole reason the Carnot efficiency takes its famous form. Because $Q_h \propto T_h$ and $Q_c \propto T_c$ over equal volume ratios, the work fraction is $\eta = W/Q_h = 1 - T_c/T_h$, set by the two reservoir temperatures and nothing else, not the gas, not the volumes. Lower the cold temperature and the loop grows taller and the efficiency climbs; raise it toward the hot temperature and the loop collapses to a sliver doing almost no net work.

The lower panel makes both points quantitative. On the left, the efficiency is plotted against $T_c/T_h$ with the current operating point marked, falling along the straight line $\eta = 1 - T_c/T_h$. On the right, the heat input $Q_h$ is drawn as a bar that splits into the work $W$ and the rejected heat $Q_c$: the first law $Q_h = W + Q_c$ as a picture, with the green work fraction equal to the efficiency and the blue remainder dumped to the cold sink.

## Reference

Callen, *Thermodynamics and an Introduction to Thermostatistics*, 2nd ed., Wiley, 1985, Ch. 4; Fermi, *Thermodynamics*, Dover, 1956, Ch. 3.

## Verification

- Strong invariants: the net work equals the heat balance $W = Q_h - Q_c$ to 1e-9; the efficiency $W/Q_h$ equals $1 - T_c/T_h$ to 1e-9; the Carnot volume condition $V_3/V_4 = V_2/V_1$ holds to 1e-9; pressure and temperature are continuous at all four corners.
- Visual gate: SSIM against committed golden frames at both folds.
