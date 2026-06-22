# The Breit-Wigner resonance

Scattering experiments mostly measure how strongly a beam is deflected as a function of energy, and most of the time that response is smooth and unremarkable. Then, at certain sharply defined energies, the cross-section leaps up by orders of magnitude. These spikes are resonances, and they are how much of subatomic physics is actually done: every unstable particle and every excited nucleus shows up as a resonance in some scattering channel. Physically, at the resonant energy the projectile and target lock together for a moment into a quasi-bound state, a configuration that is almost a real bound state but leaks back apart. The shape of the spike is universal, the Breit-Wigner Lorentzian, centred on the resonance energy $E_R$ with a full width $\Gamma$ that is inversely proportional to the lifetime of the temporary state. A narrow peak means a long-lived resonance; a broad one barely holds together. The scene fires a beam at a target and lets you sweep its energy, the scattered intensity blazing up as you pass through $E_R$.

A bump in a graph could be many things, so what certifies a true resonance is the behaviour of the quantum phase. When a wave scatters, its outgoing part is shifted relative to how it would have propagated freely, and that lag is the phase shift $\delta$. Away from any resonance the phase shift drifts slowly, but as the energy sweeps across $E_R$ it climbs rapidly and passes through exactly $\pi/2$, which is precisely the value that makes $\sin^2\delta$, and hence the cross-section, hit its maximum. The steepness of that climb is a measurable time: the Wigner time delay $\tau = 2\hbar\,d\delta/dE$, the extra moment the particle spends loitering near the target while the quasi-state forms and decays.

The lower panel puts the two signatures side by side over the same energy axis. The phase shift traces an S-curve through $\pi/2$ at the resonance, and the time delay rises to a sharp peak at the same point, both locked to the cross-section maximum above them. Sliding the width brings the connection to life: shrink $\Gamma$ and the cross-section narrows, the phase turns over more abruptly, and the time delay grows taller, all three saying the same thing in different language, that a sharper resonance is a longer-lived state.

## Reference

Sakurai and Napolitano, *Modern Quantum Mechanics*, 2nd ed., Cambridge, 2017, Ch. 6; Griffiths, *Introduction to Quantum Mechanics*, 3rd ed., Ch. 11.

## Verification

- Strong invariants: the cross-section peaks at 1 (the unitarity limit) on resonance with full width at half maximum equal to $\Gamma$; it equals $\sin^2\delta$ exactly; the phase shift passes through $\pi/2$ at $E_R$; the time delay equals $d\delta/dE$ and is larger for a narrower resonance.
- Visual gate: SSIM against committed golden frames at both folds.
