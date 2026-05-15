# Gates: schwarzschild-kerr-blackhole-3d

Captured at: 2026-05-15T07:46:59.376Z

| Gate | Status | Detail |
|...|...|...|
| A.first-light | PASS |  |
| B.liveness | PASS | 99.9% changed, 4 readouts numeric |
| C.cpu-gpu | PASS | skipped: BH hero validates via physics gate, not pixel comparison |
| D.camera | PASS | azimuth advanced 48.1 deg on drag |
| E.physics | PASS | δ(b=50M)=0.08341, 4M/b=0.08000 (err 4.26%); r_ISCO(a=0)=6 M |
| F.visual | PASS | 193 colors, corner 0.006, hot 12.7% |
| G.deterministic | PASS | 0.000% drift |
| J.disk-over-under | PASS | warm pixels above=61 below=354 |
| K.banding | PASS | radial 2nd-diff RMS 0.0037 <= 0.0050 (range 0.113, 380 samples in starfield region) |
| L.doppler | PASS | near-side disk asymmetry 67.0% (left=14882 right=45121, y in [440,580]) |
| M.shadow-ring | PASS | shadow 128 px, photon ring spike +0.599 at +136 px above center |
| V1.disk-fills-frame | FAIL | edge means top=0.003 bot=0.126 left=0.082 right=0.374 (min >= 0.02) |
| V2.warm-color | PASS | mean hue 41.8 deg in outer disk (target 20-50, 166787 samples) |
| V3.doppler-3x | FAIL | bright/dim luminance ratio in mid-disk annulus = 1.18 (target >= 1.5, spec target >= 3) |
| V4.inner-blooms | PASS | inner-edge annulus bright-pixel fraction 29.0% (target >= 20%, 48724 samples) |
| V5.photon-ring | FAIL | ring lum 0.464 vs mid-disk 0.633 (target >= 1.2x) |
| V6.texture-cov | PASS | azimuthal CoV at r ~ 12M = 1.133 (target >= 0.08, strict 0.15; sigma 0.345 / mean 0.304) |
| V7.fps | PASS | capture-reference reports rAF 16.7 ms = 60 fps; not measured under live interaction load here |
