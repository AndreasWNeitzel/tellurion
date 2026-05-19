# DEVNOTES - msc-y1/MAA-GD-galaxy-merger-nbody (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Fixed degenerate byte-identical 5-frame goldens (warmup was a fixed 600 steps regardless of captureFraction): wired CAPTURE_FRAC to sweep merger time 250..1100 steps; recaptured 5 distinct physically-correct frames (clean approach, tidal interaction with bridge/tails, phase-mixed debris), screenshot-verified. Corrected the ## Explainer to not overclaim a bound elliptical remnant the frictionless restricted model cannot produce.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: too few particles and not spiral. Replaced spherical Hernquist blob + random per-particle rotation with a coherently-rotating truncated disk of 7000 tracers/galaxy (>10x) and two trailing logarithmic spiral arms; rotation now coherent so the encounter makes proper tidal bridges/tails. Screenshot-verified spiral structure and tidal bridge; 60fps at 14000 particles.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: cores kissed and froze, dubious mass distribution, wanted real coalescence + an E-Lz diagram + per-galaxy mass sliders + Sausage analogue. Replaced with exponential (Freeman) disks; unequal-mass two-body + exact Chandrasekhar dynamical friction so the orbit decays and the nuclei coalesce into one phase-mixed remnant (no kiss-and-freeze); added M1/M2 sliders and a COM-frame energy vs angular-momentum panel color-coded by origin showing the accreted galaxy as a distinct low-Lz clump (Gaia-Enceladus/Sausage). Screenshot-verified both panels at early and merged states; 60fps at 14000 particles.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback: with an unequal-mass primary the lab-frame view let the system drift off-screen, and the E-Lz plot looked suspicious (evolves then freezes). Fixed: render the spatial panel in the shared mass-weighted COM frame so the remnant stays centered at any mass ratio; reduced the merge radius so dynamical friction drives several decaying passages (violent relaxation churns E-Lz through the merger) before coalescence. The post-settling freeze is correct physics (conserved integrals in a relaxed remnant, the basis of the Gaia-Enceladus diagnostic) and is now documented. Screenshot-verified the remnant stays centered and the E-Lz plane evolves (t-050) then settles (t-100).
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User request: compute the integrals of motion in the primary core's rest frame from now on. Replaced the mass-weighted COM reference with the more-massive core's position/velocity for both the E-Lz panel and the spatial centering (the Galactocentric analogue: the real Gaia-Enceladus/Sausage integrals are measured relative to the surviving Milky Way, not the barycentre). Labels and Explainer updated; screenshot-verified the survivor stays centered and the accreted Sausage clump is anchored on the primary.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User-directed rebuild: replaced analytic cores + Chandrasekhar/merge/damping hacks with a true self-gravitating particle-mesh N-body on the new shared engine. Merger, dynamical friction, tidal disruption, coalescence and the Sausage E-Lz signature all emergent and continuous; screenshot-verified t-000/t-050/t-100; 60fps at 3600 particles. Tests 1 passed + PM engine 6/6.

## Sweep 2026-05-18
User feedback: particles teleporting (periodic wrap) + cores too weak. Added isolated (vacuum) BCs to the shared PM engine via zero-padded Green-function convolution + a radix-2 FFT (30x faster, Poisson still exact to 1e-9). NGRID 64, no wrap: particles that leave just leave, galaxies strongly attract and merge. Screenshot-verified t-000/t-100; Sausage E-Lz preserved; 60fps. PM engine tests 9/9.

## Sweep 2026-05-18
User: secondary passed through and exited, primary disintegrated. Headless diagnostic showed a single isolated disk IS stable (engine sound) but the two-galaxy orbit was UNBOUND, so the secondary flew off the finite isolated grid (artificial escape). Fixed the initial conditions to a bound compact encounter (sep0=4, vRel=0.14, Rd=0.8), diagnostic-verified to stay grid-confined and coalesce with 100% of particles retained. Screenshot-verified the bound merger, surviving primary + accreted gold stream, Sausage E-Lz; no teleport/disintegration.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User: more particles + galaxies do not look spiral. Raised NTOT 3600 -> 16000 (PM cost is grid-bound via the radix-2 FFT so per-particle work stays cheap at 60fps) and gave each disk a two-arm trailing logarithmic-spiral azimuth on a smooth background. Screenshot-verified two dense visibly-spiral galaxies at t-000 and a correct bound merger at t-100 (accreted stream + surviving primary, Sausage E-Lz, no escape/teleport/disintegration); rAF 16.6ms.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User: disk stripped naked / no merger / out of screen / distrust E-Lz. Rebuilt each galaxy as the literature-standard multi-component model: dominant Hernquist dark-matter halo (82%, binds the disk and carries dynamical friction) + exponential 2-arm spiral disk (18%), all live PM particles. Headless diagnostic confirms a bound friction-decaying orbit, the primary disk SURVIVES (RMS ~1->2, ~92% stays bound, not stripped) and thickens (realistic merger heating). View locked to the global mass-weighted COM and zoomed so the halo stays in frame (no exit-screen). E-Lz now plots only stars with a valid PM potential (out-of-grid garbage excluded) so it matches the screen. Refs Hernquist 1990, Springel ICs, B&T Ch.8.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User: still not COM-tracking, galaxies exit frame. Root cause found: primaryCentroid() averaged over ALL particles including ones that escaped the isolated grid and coast ballistically to huge coordinates, dragging the 'COM' off the visible system. Replaced with a robust two-pass COM (on-grid particles, then refined within a 6-unit clip radius). Headless diagnostic now shows 100% of stellar-disk particles within the view half-width of the robust COM at every step from 0 to 1500: the galaxies never leave the frame. Screenshot-verified centred.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User: make the secondary a diffuse galaxy (not spiral, random orbits). The satellite stellar component is now a smooth centrally-concentrated blob (uniform azimuth, no arms) with isotropic Jeans-dispersion velocities (pressure-supported), like a dwarf spheroidal, the realistic Sausage progenitor. Primary remains a rotation-supported 2-arm spiral. Screenshot-verified the spiral+diffuse pair and the diffuse dwarf tidally disrupted and accreted onto the surviving primary; robust-COM framed.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User: make it 3D, stunning graphics, add an angle-of-attack slider, oblique camera. The 60fps gate makes a true 3D-PM solve infeasible on CPU (~220ms/step, diagnostic-confirmed), and there is no WebGL gate precedent in-repo (all 3D heroes are gateable Canvas2D pseudo-3D); so this lands the proven gateable pattern: the verified in-plane self-gravitating PM physics with passive 3D z-structure, an angle-of-attack slider that tilts the infalling secondary's plane/approach, an oblique fixed camera (yaw 0.46, pitch 0.55), depth-binned painter ordering, additive stellar glow, faint dark-halo haze, deterministic starfield, robust bound-COM-locked view. Screenshot-verified the 3D angled look, spiral primary + inclined diffuse dwarf, disruption + surviving primary, Sausage E-Lz; 60fps. WebGL polish is the documented next enhancement.
invariants Tests 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
User feedback round: not 3D / no visual gain / slow merge / vertical jets / secondary escapes / single-core looked more definitive.
Fixes: real dynamical Spitzer-sheet vertical mode (nu^2=2piG Sigma/H from PM surface density, kills the |a_R|/R-proxy vertical jets); inclined perspective camera + drag-orbit/wheel-zoom/shift-pan; heavier bound concentrated companion (M1=1.1,M2=0.7,sep=2.6,vRel=0.07,EPS=1.2c) so dynamical friction sinks it decisively (headless: 1st passage ~248, merged ~294, secondary 100% bound, jetFrac=0, t=0 vertical equilibrium); solid-disc core glow (rasterizer-stable); accurate card text; full spec rewrite. Golden sweep = reproducible in-fall (chaotic post-merger shown live).
invariants 1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real 3D rebuild: user wanted a proper 3D animation (the 2D was a diagnostic clue). Built shared/js/engine/barnes-hut-3d.js (O(N log N) octree, threaded traversal, Plummer softening, KDK leapfrog) + tests 6/6 (vs direct <2% at theta 0.5, exact at theta 0, momentum bounded, deterministic, cold-collapse); fixed octree empty-node bug. 3D galaxy model in model.js (Hernquist halos + spiral disk + diffuse dwarf; aoa = inclination of companion approach to primary disk plane). Headless: DECISIVE-MERGE (first passage ~162, merged ~199, no NaN). Web Worker built then reverted: faithful cuspy 20k = ~447 ms/step (~2 physics-fps even in a worker); user chose ship-smooth, so N=3000 is the honest per-frame 60fps ceiling (~10 ms/step). Orbit camera (drag rotate / wheel zoom / shift pan), Sausage E-Lz via Barnes-Hut potential. invariants 1 + engine 6/6, visual 5/5 x3. Shipped.

## Sweep 2026-05-19
User: bump to 10k; DM can be few heavy low-res particles, stars numerous and shining; rotate -90..+90; zoom further. Done: NTOT=10000 with the Barnes-Hut tree solve offloaded to a module Web Worker (worker.js) posting transferable snapshots, main thread renders latest at 60fps; deterministic SSIM-gate path runs the same model+engine synchronously. STAR_FRAC=0.90 -> ~9000 light shining stars + ~1000 dark-halo particles ~36x heavier (standard mass-resolution split, 80% DM mass). Camera pitch clamp -1.5708..1.5708 (full down-to-up), zoom max 20. Headless: DECISIVE-MERGE (first pass ~147, merged ~173, no NaN) at the star-heavy split. invariants 1 + engine 6/6, visual 5/5 x3 deterministic. Shipped.

## Sweep 2026-05-19
User: bump to 12000 (DM 500 total); polar rotation was 0..90..0 (edge at both ends) -> wanted -90..0..90 (face/edge/face). Done: NTOT=12000, STAR_FRAC=1-500/NTOT -> ~11500 light shining stars + ~500 dark-matter particles ~92x heavier (verified DECISIVE-MERGE first pass ~130 merged ~156, no NaN, worker ~15 steps/s). Polar/pitch projection corrected: screen_y=y1*sin(p)+z*cos(p), depth=z*sin(p)-y1*cos(p) so pitch 0=edge-on, +/-90=the two face-on views (verified by 3 screenshots: spiral face-on at +90, thin edge at 0, face-on other side at -90). Dynamic NTOT in title/readout. invariants 1 + engine 6/6, visual 5/5 x3 deterministic. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  1 passed + visual 5/5 x3. Shipped.
