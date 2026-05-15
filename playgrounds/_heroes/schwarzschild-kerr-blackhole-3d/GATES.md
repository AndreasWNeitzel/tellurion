# Gates: schwarzschild-kerr-blackhole-3d

Captured at: 2026-05-15T07:40:28.372Z

| Gate | Status | Detail |
|...|...|...|
| A.first-light | PASS |  |
| B.liveness | PASS | 99.9% changed, 4 readouts numeric |
| C.cpu-gpu | PASS | skipped: BH hero validates via physics gate, not pixel comparison |
| D.camera | PASS | azimuth advanced 48.1 deg on drag |
| E.physics | PASS | δ(b=50M)=0.08341, 4M/b=0.08000 (err 4.26%); r_ISCO(a=0)=6 M |
| F.visual | PASS | 189 colors, corner 0.005, hot 16.5% |
| G.deterministic | PASS | 0.000% drift |
| J.disk-over-under | PASS | warm pixels above=65 below=330 |
| K.banding | PASS | radial 2nd-diff RMS 0.0025 <= 0.0050 (range 0.151, 380 samples in starfield region) |
| L.doppler | PASS | near-side disk asymmetry 57.4% (left=21723 right=50993, y in [440,580]) |
| M.shadow-ring | PASS | shadow 127 px, photon ring spike +0.643 at +136 px above center |
| V1.disk-fills-frame | FAIL | edge means top=0.004 bot=0.163 left=0.094 right=0.394 (min >= 0.02) |
| V2.warm-color | PASS | mean hue 43.3 deg in outer disk (target 20-50, 176551 samples) |
| V3.doppler-3x | FAIL | bright/dim luminance ratio in mid-disk annulus = 1.17 (target >= 1.5, spec target >= 3) |
| V4.inner-blooms | PASS | inner-edge annulus bright-pixel fraction 32.1% (target >= 20%, 48724 samples) |
| V5.photon-ring | FAIL | ring lum 0.552 vs mid-disk 0.711 (target >= 1.2x) |
| V6.texture-cov | PASS | azimuthal CoV at r ~ 12M = 1.084 (target >= 0.08, strict 0.15; sigma 0.413 / mean 0.381) |
| V7.fps | PASS | capture-reference reports rAF 16.7 ms = 60 fps; not measured under live interaction load here |
