# Blackbody radiation: Planck vs Rayleigh-Jeans

At the close of the nineteenth century classical physics made a prediction that was spectacularly wrong. Treating the radiation trapped in a hot cavity as a sum over standing-wave modes, and giving each mode the same average thermal energy $k_B T$ as the equipartition theorem demands, leads to the Rayleigh-Jeans law, a spectral radiance of $2c k_B T/\lambda^4$. Because there is no limit to how many short-wavelength modes a cavity supports, this grows without bound as the wavelength shrinks: a glowing oven should pour out infinite energy at the ultraviolet end, the ultraviolet catastrophe. Real ovens do nothing of the kind. Planck's resolution in 1900 was to suppose that the cavity oscillators can only gain or lose energy in discrete quanta of size $h\nu$, which makes the high-frequency modes too expensive to excite thermally and yields $B_\lambda = (2hc^2/\lambda^5)/(e^{hc/\lambda k_B T}-1)$. The top panel plots both laws; the bottom panel tracks the total power.

At long wavelengths the quantum $h\nu$ is small compared with $k_B T$, the exponential linearises, and Planck's curve lies right on top of Rayleigh-Jeans, which is why the classical law looked fine in the infrared. Toward the short, ultraviolet end the two part company dramatically: the red dashed Rayleigh-Jeans curve climbs off the top of the plot while the gold Planck curve turns over and falls smoothly to zero, exactly as measured. Raise the temperature and the Planck peak slides toward shorter wavelengths, the reason a cool star glows red and a hot one blue, while the whole curve swells; the green marker tracks the peak and shows Wien's law, that $\lambda_\text{max}$ times $T$ stays fixed at about 2.9 mm K. The bottom plot integrates the area under the curve into the total radiated power and shows it climbing as a straight slope-four line on log-log axes, the Stefan-Boltzmann $T^4$ law, so doubling the temperature multiplies the power by sixteen.

The temperature slider sweeps from a dim red heat to a blue-white star, the toggle switches the horizontal axis between wavelength and frequency, and Reset returns to the Sun's 5778 K. Every curve uses the real values of $h$, $c$, $k_B$, and the Stefan-Boltzmann and Wien constants.

## Reference

Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei and Particles*, 2nd ed., Ch. 1; Planck 1901, Annalen der Physik 4, 553.

## Verification

- Strong invariants: Planck reduces to Rayleigh-Jeans at long wavelength; the Planck peak satisfies Wien's law $\lambda_\text{max}T = 2.898\times10^{-3}$ m K; the total power follows Stefan-Boltzmann $\sigma T^4$ (verified by integrating Planck and by the doubling-to-sixteen scaling).
- Visual gate: SSIM against committed golden frames at both folds.
