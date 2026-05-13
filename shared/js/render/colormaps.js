// Perceptually uniform colormaps for scalar fields.
// Coefficients are the polynomial fit from matplotlib's source; precision good to 1 unit on 8-bit RGB.
// Reference: matplotlib/lib/matplotlib/_cm_listed.py

// Sample viridis at t in [0, 1] returning {r, g, b} in [0, 255].
export function viridis(t) {
  t = Math.max(0, Math.min(1, t));
  const r = clamp255(Math.round(255 * (
    0.280268003 - 0.143510503 * t + 2.225793877 * t * t
    - 14.815088879 * t ** 3 + 25.212752309 * t ** 4
    - 11.772589584 * t ** 5
  )));
  const g = clamp255(Math.round(255 * (
    -0.002066479 + 1.391779154 * t - 1.094504892 * t * t
    + 0.687494224 * t ** 3 - 0.137222032 * t ** 4
    - 0.045054964 * t ** 5
  )));
  const b = clamp255(Math.round(255 * (
    0.329415004 + 1.388047825 * t - 5.747396188 * t * t
    + 5.879049773 * t ** 3 + 4.376094759 * t ** 4
    - 5.224500528 * t ** 5
  )));
  return { r, g, b };
}

// Sample cividis. Colorblind-safe alternative.
export function cividis(t) {
  t = Math.max(0, Math.min(1, t));
  const r = clamp255(Math.round(255 * (
    -0.0048499544 + 0.5650557240 * t + 1.4112465752 * t * t
    - 1.4847088258 * t ** 3 + 0.5108080598 * t ** 4
  )));
  const g = clamp255(Math.round(255 * (
    0.1283440183 + 0.7515432754 * t + 0.0419727099 * t * t
    + 0.1148953093 * t ** 3 - 0.0367492816 * t ** 4
  )));
  const b = clamp255(Math.round(255 * (
    0.3043207085 + 0.7611049017 * t - 1.8413820596 * t * t
    + 1.6552834247 * t ** 3 - 0.5793169842 * t ** 4
  )));
  return { r, g, b };
}

// Diverging colormap centered on zero. Useful for signed scalar fields (e.g., E_z in FDTD).
// Adaptation of matplotlib's RdBu_r truncated to safe luminance range.
export function rdbu(t) {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.5) {
    const s = t * 2;
    return {
      r: clamp255(Math.round(33 + s * (244 - 33))),
      g: clamp255(Math.round(102 + s * (244 - 102))),
      b: clamp255(Math.round(172 + s * (244 - 172)))
    };
  }
  const s = (t - 0.5) * 2;
  return {
    r: clamp255(Math.round(244 + s * (178 - 244))),
    g: clamp255(Math.round(244 + s * (24 - 244))),
    b: clamp255(Math.round(244 + s * (43 - 244)))
  };
}

// Write a scalar field into ImageData using a chosen colormap.
// field: Float32Array or Float64Array of length width*height
// vmin, vmax: scaling
// cmap: function (t) -> {r,g,b}
export function fieldToImageData(field, width, height, vmin, vmax, cmap = viridis, imageData = null) {
  imageData = imageData ?? new ImageData(width, height);
  const data = imageData.data;
  const range = vmax - vmin || 1;
  for (let i = 0; i < field.length; i += 1) {
    const t = (field[i] - vmin) / range;
    const c = cmap(t);
    const j = i * 4;
    data[j]     = c.r;
    data[j + 1] = c.g;
    data[j + 2] = c.b;
    data[j + 3] = 255;
  }
  return imageData;
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

export const COLORMAPS = { viridis, cividis, rdbu };
