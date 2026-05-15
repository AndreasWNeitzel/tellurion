# Gates: schwarzschild-kerr-blackhole-3d

Captured at: 2026-05-15T08:19:46.770Z

| Gate | Status | Detail |
|...|...|...|
| A.first-light | PASS |  |
| B.liveness | PASS | 99.8% changed, 4 readouts numeric |
| C.cpu-gpu | PASS | skipped: BH hero validates via physics gate, not pixel comparison |
| D.camera | PASS | azimuth advanced 48.1 deg on drag |
| E.physics | PASS | δ(b=50M)=0.08341, 4M/b=0.08000 (err 4.26%); r_ISCO(a=0)=6 M |
| F.visual | PASS | 193 colors, corner 0.006, hot 20.4% |
| G.deterministic | PASS | 0.000% drift |
| J.disk-over-under | PASS | warm pixels above=69 below=336 |
| K.banding | PASS | radial 2nd-diff RMS 0.0037 <= 0.0050 (range 0.113, 380 samples in starfield region) |
| L.doppler | PASS | near-side disk asymmetry 60.1% (left=18260 right=45725, y in [440,580]) |
| M.shadow-ring | PASS | shadow 126 px, photon ring spike +0.729 at +136 px above center |
| V1.disk-fills-frame | FAIL | edge means top=0.003 bot=0.184 left=0.032 right=0.481 (min >= 0.02) |
| V2.warm-color | PASS | mean hue 46.5 deg in outer disk (target 20-50, 158252 samples) |
| V3.doppler-3x | FAIL | bright/dim luminance ratio in mid-disk annulus = 1.37 (target >= 1.5, spec target >= 3) |
| V4.inner-blooms | PASS | inner-edge annulus bright-pixel fraction 39.3% (target >= 20%, 48724 samples) |
| V5.photon-ring | FAIL | ring lum 0.658 vs mid-disk 0.739 (target >= 1.2x) |
| V6.texture-cov | PASS | azimuthal CoV at r ~ 12M = 1.047 (target >= 0.08, strict 0.15; sigma 0.433 / mean 0.414) |
| V7.fps | PASS | capture-reference reports rAF 16.7 ms = 60 fps; not measured under live interaction load here |
