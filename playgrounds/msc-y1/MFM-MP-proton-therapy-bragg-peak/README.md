# Proton Therapy: the Bragg Peak and the Spread-Out Bragg Peak

This is why proton therapy exists. A heavy charged particle slowing in tissue loses energy faster the slower it goes, so it dumps most of its dose in a sharp spike, the Bragg peak, right at the end of its range, and then stops dead. A photon beam does the opposite: it builds up to a shallow maximum near the surface and keeps depositing dose all the way through the patient. The depth of the proton peak is fixed by the beam energy through the Bragg-Kleeman rule R = alpha E0^1.77, and a tumour of finite thickness is covered by stacking peaks of decreasing energy into a flat spread-out Bragg peak.

What to look for: in pristine mode the gold proton curve barely registers on the way in, spikes at the range, and vanishes, while the blue photon curve sails past it and irradiates everything downstream, the patient panel makes the tissue-sparing obvious. Switch to the spread-out Bragg peak and the construction panel shows dozens of weighted pristine peaks summing to a flat therapeutic plateau over the tumour with a sharp distal edge. Drop the energy and the whole peak moves shallower exactly as R ~ E0^1.77; widen the SOBP and the plateau stretches to cover a thicker target.

Controls: the energy slider sets the range and therefore the Bragg-peak depth; the mode selector switches between the pristine-versus-photon comparison and the spread-out Bragg peak; the width slider sets how thick a tumour the SOBP covers. Reset restores a 150 MeV pristine beam; Pause freezes the marker, the curves are static.

## Reference

Primary citation: Wilson, Radiological Use of Fast Protons, Radiology 47, 487 (1946); Bortfeld, Med. Phys. 24, 2024 (1997).

## Verification

- Strong invariant: R = alpha E0^1.77 (R(2E)/R(E) within 2 percent of 2^1.77); the Bragg peak is at the end of range with no dose 1 cm beyond.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
