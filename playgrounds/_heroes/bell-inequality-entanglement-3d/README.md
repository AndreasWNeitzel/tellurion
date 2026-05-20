# Bell Inequality and Quantum Entanglement (Hero)

Bell (1964) showed that quantum mechanics predicts correlations between
distant entangled particles that no local hidden-variable theory can
reproduce. The CHSH inequality (Clauser-Horne-Shimony-Holt 1969)
gives a sharp test: classical $|S| \le 2$, quantum singlet can reach
$|S| = 2\sqrt{2} \approx 2.828$. Aspect (1982) measured $|S| =
2.697 \pm 0.015$, ruling out local realism.

## What to look for

A singlet source in the middle of the canvas emits a pair of photons.
Two pairs of polarizer settings (cyan = Alice, orange = Bob) are
shown as oriented sticks inside detector boxes. The bottom-left
panel plots the quantum correlation $E(a - b) = -\cos(2(a-b))$ (gold
curve) against the local-hidden-variable envelope (cyan dashed); a
white dot marks the current $(a, b)$ position. The bottom-right
panel shows the absolute CHSH statistic $|S|$ as a bar, with the
classical bound at 2 (red line) and the Tsirelson quantum maximum
$2\sqrt{2}$ (green dashed) marked.

## Controls

Four sliders set the angles $a, a', b, b'$ in degrees. The preset
menu jumps to:

- **optimal CHSH** ($a = 0, a' = 45, b = 22, b' = 67$ deg) which
  reaches $|S| = 2\sqrt{2}$.
- **aligned** ($a = b = 0, a' = b' = 90$ deg) which gives $|S| = 2$
  exactly (right at the classical bound).
- **random**: random angles for an interactive comparison.

The reset button clears the photon stream's running correlation.

## Source

Bell, *Physics* 1 (1964) 195. CHSH derivation: Clauser, Horne,
Shimony, Holt, *Phys. Rev. Lett.* 23 (1969) 880. First experimental
violation: Aspect, Grangier, Roger, *Phys. Rev. Lett.* 49 (1982) 91.
Modern loophole-free tests: Hensen et al. *Nature* 526 (2015) 682;
Giustina et al. *Phys. Rev. Lett.* 115 (2015) 250401; Shalm et al.
*Phys. Rev. Lett.* 115 (2015) 250402.
