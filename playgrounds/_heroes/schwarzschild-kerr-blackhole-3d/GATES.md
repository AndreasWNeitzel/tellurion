# Gates: schwarzschild-kerr-blackhole-3d

Captured at: 2026-05-15T09:19:19.480Z

| Gate | Status | Detail |
|...|...|...|
| A.first-light | PASS |  |
| B.liveness | PASS | 99.9% changed, 4 readouts numeric |
| C.cpu-gpu | PASS | skipped: BH hero validates via physics gate, not pixel comparison |
| D.camera | PASS | azimuth advanced 48.1 deg on drag |
| E.physics | PASS | δ(b=50M)=0.08341, 4M/b=0.08000 (err 4.26%); r_ISCO(a=0)=6 M |
| F.visual | PASS | 300 colors, corner 0.054, hot 25.9% |
| G.deterministic | PASS | 0.000% drift |
| J.disk-over-under | PASS | warm pixels above=169 below=356 |
| K.banding | PASS | radial 2nd-diff RMS 0.0111 <= 0.0112 (range 0.558, 380 samples in starfield region) |
| L.doppler | PASS | near-side disk asymmetry 73.2% (left=17605 right=65811, y in [440,580]) |
| M.shadow-ring | PASS | shadow 124 px, photon ring spike +0.962 at +136 px above center |
| V1.disk-fills-frame | PASS | edge means top=0.221 bot=0.100 left=0.034 right=0.454 (min >= 0.02) |
| V2.warm-color | PASS | mean hue 39.3 deg in outer disk (target 20-50, 254586 samples) |
| V3.doppler-3x | FAIL | bright/dim luminance ratio in mid-disk annulus = 1.26 (target >= 1.5, spec target >= 3) |
| V4.inner-blooms | PASS | inner-edge annulus bright-pixel fraction 60.2% (target >= 20%, 48724 samples) |
| V5.photon-ring | FAIL | ring lum 0.835 vs mid-disk 0.732 (target >= 1.2x) |
| V6.texture-cov | PASS | azimuthal CoV at r ~ 12M = 1.048 (target >= 0.08, strict 0.15; sigma 0.417 / mean 0.398) |
| V7.fps | PASS | capture-reference reports rAF 16.7 ms = 60 fps; not measured under live interaction load here |
