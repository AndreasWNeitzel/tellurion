# DEVNOTES - FIS1013-elastic-inelastic-collisions-2d (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Two disks collide obliquely; restitution e and impact
parameter b adjustable. Collision resolved along the contact normal
(normal component scaled by e, tangential unchanged). Readout: type,
e, b, post speeds, KE loss %, conserved p_x. Pure local sim.js.

## Post-build sweep record (2026-05-18) - spec/impl divergence fixed
- Opus visual-reviewer 6/6 PASS; it noted the spec said "1D" while
  the render is 2D oblique. Confirmed by my own t-075 inspection:
  readout literally "2D oblique collision e=0.90 impact b=0.40 ...
  p_x conserved", two disks with deflected trails + velocity vectors.
- Real defect: spec frontmatter title, spec body header/intro,
  index.html <h1> and the "What you are seeing" para all said
  "1D head-on" while the slug is ...-2d and the implementation is 2D
  oblique. Rewrote all of them truthfully to the 2D oblique collision
  (b=0 noted as the head-on 1D limit), added the standard spec
  sections, rewrote the placeholder hook/one_paragraph, removed the
  raw marion-thornton key and the redundant trailing "Source:" from
  the description para. Render-neutral (the render was already the
  correct 2D one), NO recapture.
- Invariants unaffected. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).
