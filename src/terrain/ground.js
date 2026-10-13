// World coordinate -> chunk index c and fractional vertex index g inside that
// chunk (vertex i sits at c * cs - cs / 2 + i * cs / (cs - 1)).
export function worldToGrid (v, cs) {
  const c = Math.floor(v / cs + 0.5)
  return { c, g: (v - c * cs + cs / 2) * (cs - 1) / cs }
}

// Height of the rendered surface at fractional vertex index (gx, gz).
// PlaneGeometry splits each grid cell into triangles (a, b, d) and (b, c, d):
// a = (ix, iz), b = (ix, iz + 1), c = (ix + 1, iz + 1), d = (ix + 1, iz).
export function heightInGrid (heights, cs, gx, gz) {
  gx = Math.min(Math.max(gx, 0), cs - 1)
  gz = Math.min(Math.max(gz, 0), cs - 1)
  const ix = Math.min(Math.floor(gx), cs - 2)
  const iz = Math.min(Math.floor(gz), cs - 2)
  const tx = gx - ix
  const tz = gz - iz
  const k = iz * cs + ix
  const a = heights[k]
  const d = heights[k + 1]
  const b = heights[k + cs]
  const c = heights[k + cs + 1]
  return tx + tz <= 1
    ? a + (d - a) * tx + (b - a) * tz
    : c + (b - c) * (1 - tx) + (d - c) * (1 - tz)
}
