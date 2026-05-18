# Ionization-Chamber Dosimetry: Charge, W and Bragg-Gray

An ionization chamber is the workhorse that tells a radiotherapy clinic how much radiation a patient actually received. It is just a small box of gas between two charged plates. A photon comes in, knocks an electron loose, and that fast electron rips other electrons off gas molecules as it travels, leaving a trail of positive and negative ion pairs. It costs the same average energy, called W (about 34 electron-volts in air), to make each pair, so counting the pairs is really counting the energy deposited. The voltage on the plates sweeps the pairs apart and out to be measured as an electric charge.

What to look for: turn the voltage down and watch the pairs start to recombine in the middle of the gap before they ever reach a plate, the faded circled dots are the ones that are lost, and the measured dose drops even though the radiation has not changed. Turn the voltage up and almost every pair is collected, the reading saturates at its true value. That rise-and-flatten shape in the middle panel is the saturation curve every medical physicist checks; crank the dose rate up and it gets worse, because crowded ions find each other more easily. The right panel follows the whole arithmetic from energy deposited, to ion pairs, to charge, to dose in the gas, and finally to dose in tissue via the Bragg-Gray ratio.

Controls: the energy slider sets how hard the photons hit and how much energy they leave behind; the voltage slider moves you along the saturation curve from heavy recombination to full collection; the dose-rate slider shows why high-output beams need careful recombination corrections. Reset returns to a typical 300 V operating point; Pause freezes the drifting ions.

## Reference

Primary citation: ICRU Report 90 (2014); Boag and Currant, Br. J. Radiol. 23, 601 (1950); Attix, Introduction to Radiological Physics and Radiation Dosimetry (1986).

## Verification

- Strong invariant: W_air = 33.97 eV per ion pair (1 percent); the Boag efficiency saturates to 1 at high voltage and the dose is exactly linear in collected charge.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
