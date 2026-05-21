---
title: MOSFET Operation: Channel, Pinch-off and I-V Regions
slug: mosfet-operation-animated
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4026
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: shichman-hodges1968
hook: 'An n-channel MOSFET stays off until the gate passes the threshold, then carries a current that first rises with drain voltage and then clamps flat once the inversion channel pinches off at the drain. The pinch-off and the triode/saturation boundary both sit exactly at V_DS = V_GS - V_th, and the square law is continuous and smooth across it.'
one_paragraph: 'An interactive n-channel enhancement MOSFET using the square-law (level-1, Shichman and Hodges 1968) model with a subthreshold exponential tail (Neamen, Semiconductor Physics and Devices, 4th ed., Ch. 10-11; Sze and Ng). Below threshold (V_GS < V_th) the device is off and the drain current is a tiny subthreshold exponential; above threshold the inversion channel forms and, for V_DS < V_ov = V_GS - V_th, the device is in the triode region with I_D = k_n[V_ov V_DS - V_DS^2/2]; at V_DS = V_ov the channel pinches off at the drain and the device saturates at I_D = (k_n/2) V_ov^2 (1 + lambda V_DS). The output panel draws the I_D-V_DS family for several gate voltages with the pinch-off locus V_DS = V_GS - V_th, the cross-section panel animates the inversion channel tapering and pinching off as V_DS sweeps, and the transfer panel shows I_D-V_GS with the threshold, so the gate-controlled switch and the saturated current source the device acts as are both visible. Reference: Neamen, Semiconductor Physics and Devices, Chapters 10 to 11; Sze and Ng, Physics of Semiconductor Devices, Chapter 6.'
tags: [semiconductors, transistors, device-physics, mosfet, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [vgs, vth, lam]
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# MOSFET Operation: Channel, Pinch-off and I-V Regions

## Explainer

### What you are looking at

The MOSFET is the transistor inside essentially every chip. A voltage
on an insulated gate conjures a conducting channel between source and
drain; the drain voltage then drives a current that saturates once the
channel "pinches off". The playground animates the channel forming and
pinching and the three operating regions on the I-V curve.

### Forming the channel

The gate sits on a thin oxide over p-type silicon. Raise the gate
voltage past the threshold $V_{th}$ and it repels holes and attracts
electrons, inverting the surface into a thin n-type channel that
connects the n+ source and drain. The amount of channel charge is set
by the overdrive

$$V_{ov} = V_{GS} - V_{th}.$$

Below threshold ($V_{ov}<0$) there is no channel: cutoff, no current.

### The three regions (square-law model)

With the channel present, the drain-source voltage $V_{DS}$ decides the
behavior:

- Triode (ohmic), $V_{DS} < V_{ov}$: the channel spans source to drain
  and acts like a voltage-controlled resistor,

$$I_D = k\left[(V_{ov})V_{DS} - \tfrac12 V_{DS}^2\right].$$

- Pinch-off at $V_{DS} = V_{ov}$: the channel charge at the drain end
  goes to zero (the gate-to-channel voltage there equals $V_{th}$).
- Saturation, $V_{DS} > V_{ov}$: the pinch point detaches from the
  drain; current stops growing and is set by the gate alone,

$$I_D = \tfrac12\,k\,V_{ov}^2.$$

That flat saturation current, controlled by $V_{GS}$ and nearly
independent of $V_{DS}$, is what makes the MOSFET an amplifier and a
clean digital switch. The playground sweeps $V_{GS}$ and $V_{DS}$ and
shows the channel pinch and the I-V curve flatten into saturation.

### Things to try

- Hold $V_{GS}$ and ramp $V_{DS}$: watch the channel pinch at the
  drain when $V_{DS}=V_{ov}$ and the current flatten.
- Below $V_{th}$: confirm no channel and no current (cutoff, the
  digital "off").
- Step $V_{GS}$ up and watch the saturation current rise as
  $V_{ov}^2$.

### Where this comes from

The inversion-channel picture and the square-law triode/saturation
equations follow the Shichman-Hodges (level-1) model and Neamen,
*Microelectronics: Circuit Analysis and Design*.

## Physical setup

An n-channel enhancement MOSFET: a gate over a thin oxide above a
p-type body, with n+ source and drain. Raising the gate voltage past
the threshold V_th inverts the surface into an n-type channel
connecting source and drain. The drain-source voltage then drives a
current whose behaviour splits into three regions (cutoff, triode,
saturation), with the channel physically pinching off at the drain
once V_DS reaches the overdrive V_GS - V_th.

## Governing equations

Square-law (level-1) model (Shichman and Hodges 1968; Neamen 2012).
With V_ov = V_GS - V_th:

```math
I_D = \begin{cases}
I_\mathrm{sub}\,e^{V_\mathrm{ov}/(n V_T)} & V_\mathrm{ov}\le 0 \;(\text{cutoff})\\[4pt]
k_n\!\left[V_\mathrm{ov} V_{DS} - \tfrac12 V_{DS}^2\right] & 0<V_{DS}<V_\mathrm{ov}\;(\text{triode})\\[4pt]
\tfrac{k_n}{2} V_\mathrm{ov}^2\,(1+\lambda V_{DS}) & V_{DS}\ge V_\mathrm{ov}\;(\text{saturation})
\end{cases}
```

The triode and saturation expressions meet at `V_DS = V_ov` with
equal value and equal slope (the square law is C1 there for
`lambda = 0`). The gradual-channel potential `V(x)` along the channel
solves `k_n[V_ov V - V^2/2] = I_D x/L`, giving the channel taper and
the pinch-off at the drain in saturation.

## Numerical method

All currents and the channel profile are evaluated from the closed
forms (a quadratic solve for the gradual-channel potential). The
operating point sweeps `V_DS` from 0 to 6 V; the capture path maps
capture fraction directly to `V_DS = f * 6 V`, so reference frames are
reproducible and frame-rate independent. Deterministic, no RNG.

## Controls

- `gate V_GS` (share key `vgs`): gate-source voltage; selects the
  highlighted output curve and the operating point.
- `threshold V_th` (share key `vth`): threshold voltage; shifts the
  turn-on and the pinch-off locus.
- `channel-length mod lambda` (share key `lam`): tilts the saturation
  region (finite output resistance).
- Reset (`V_GS = 3`, `V_th = 1`, `lambda = 0`), Pause/Play (Play
  replays the V_DS sweep), Copy URL.

## Expected qualitative features

- `V_GS < V_th`: essentially no current (cutoff).
- Triode: `I_D` rises with `V_DS`, ohmic for small `V_DS`.
- At `V_DS = V_GS - V_th` the channel pinches off at the drain; beyond
  it `I_D` is flat (`lambda = 0`) or slightly rising (`lambda > 0`).
- The pinch-off locus is the parabola `I_D = (k_n/2) V_DS^2`.
- Cross-section: no channel below threshold; a uniform channel at
  `V_DS = 0`; a channel tapering to zero at the drain in saturation.
- Transfer curve: zero below `V_th`, then square-law (in saturation)
  or roughly linear in overdrive (at small `V_DS`).

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Subthreshold off-current is `< 1e-6` of the on-state saturation
   current.
2. The triode/saturation boundary is exactly `V_DS = V_GS - V_th`
   (to 0.1% and to 12 digits) and the model is C1 there (value
   continuous, slope -> 0 at pinch).
3. Saturation current is quadratic in the overdrive
   (`I_sat(2 V_ov)/I_sat(V_ov) = 4`).
4. Deep triode is ohmic: `R_on = 1/(k_n V_ov)` and the small-`V_DS`
   conductance equals `1/R_on`.
5. `I_D` rises monotonically with `V_GS`; saturation is flat for
   `lambda = 0` and tilts up for `lambda > 0`.
6. The inversion channel is full at the source, tapers toward the
   drain, pinches off (zero at the drain) in saturation, and is
   absent in cutoff.
7. Determinism: identical inputs reproduce the curves bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `V_GS -> V_th^-`: `I_D -> 0` (test 1).
- `V_DS -> 0`: ohmic channel, `I_D = V_DS / R_on` (test 4).
- `V_DS = V_ov`: continuous, smooth transition (test 2).
- `lambda = 0`: ideal flat saturation (test 5).

## Visual fallback

Static three-panel Canvas2D: the output family and transfer curve are
fully informative without animation; only the operating point and the
cross-section channel taper change with the swept `V_DS`, and all
family curves are always drawn.

## Citations

- Shichman, H. and Hodges, D. A., IEEE J. Solid-State Circuits 3, 285
  (1968). `shichman-hodges1968`.
- Neamen, D. A., *Semiconductor Physics and Devices*, 4th ed.,
  McGraw-Hill 2012, Ch. 10-11. `neamen2012`.
- Sze, S. M. and Ng, K. K., *Physics of Semiconductor Devices*.
  `sze-devices`.

## Stretch goals

- Body effect (V_th dependence on source-body bias).
- Velocity saturation / short-channel model for modern nodes.
- Subthreshold-slope readout and DIBL.

## Risk register

- Square-law is an idealisation (no velocity saturation): stated
  explicitly; the gate tests target the level-1 identities it does
  satisfy exactly.
- Subthreshold seam at `V_ov = 0` (exponential vs square law): the
  off-current test uses a margin below threshold so the tiny
  discontinuity is irrelevant to the 1e-6 criterion.
- Channel profile is the gradual-channel approximation: pinch-off is
  exactly at the drain edge for level-1, which is what is drawn.
