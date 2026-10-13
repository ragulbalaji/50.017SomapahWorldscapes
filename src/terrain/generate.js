import { seed, simplex2, perlin2 } from './noise.js'
import { MODELS } from '../config.js'

// Instance matrix (column-major, world space) for a decoration standing at
// (wx, wy, wz), rotated by troty around Y, with the model scale 8 baked in.
function pushDecoration (list, wx, wy, wz, troty) {
  const c = 8 * Math.cos(troty)
  const s = 8 * Math.sin(troty)
  list.push(c, 0, -s, 0, 0, 8, 0, 0, s, 0, c, 0, wx, wy, wz, 1)
}

function hash01 (i, j, seed, salt) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca77)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

function smoothstep (e0, e1, x) { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }

function terrace (h, step, ramp) { const t = h / step; const b = Math.floor(t); return (b + smoothstep(1 - ramp, 1, t - b)) * step }

// Generates the terrain of chunk (cx, cz): a cs x cs vertex grid centered at
// (cx * cs, cz * cs), whose edge rows and columns coincide with the neighbours'.
// Pure function of (params, cx, cz); runs in Node, the main thread or a worker.
export function generateChunk (params, cx, cz) {
  const cs = params.chunk_size
  const seg = cs / (cs - 1)
  const half = cs / 2
  const x0 = (cx - 0.5) * (cs - 1) + params.chunk_noise_x_offset
  const z0 = (cz - 0.5) * (cs - 1) + params.chunk_noise_z_offset
  const heights = new Float32Array(cs * cs)
  const uvs = new Float32Array(cs * cs * 2)
  const lists = {}
  for (const key of Object.keys(MODELS)) lists[key] = []

  seed(params.world_seed)

  // Voronoi biome cells: each cell (i, j) has a jittered feature point and its own climate.
  const size = params.biome_cell_size
  const cells = new Map()
  const cellAt = (i, j) => {
    const key = `${i},${j}`
    let cell = cells.get(key)
    if (cell === undefined) {
      const fx = (i + hash01(i, j, params.world_seed, 1)) * size
      const fz = (j + hash01(i, j, params.world_seed, 2)) * size
      const temp = (simplex2(fx / params.temp_divisor, fz / params.temp_divisor) + 1) / 2
      const rain = Math.min((simplex2(fx / params.rain_divisor, fz / params.rain_divisor) + 1) / 2, 0.99 - temp)
      const terrace = hash01(i, j, params.world_seed, 3) < params.terrace_fraction ? 1 : 0
      cell = { fx, fz, temp, rain, terrace }
      cells.set(key, cell)
    }
    return cell
  }

  for (let y = 0; y < cs; y++) {
    for (let x = 0; x < cs; x++) {
      const k = y * cs + x
      const j = 2 * k
      const nx = x0 + x
      const nz = z0 + y
      const qx = nx + params.biome_warp * simplex2(nx / 256 + 31.7, nz / 256 + 47.3)
      const qz = nz + params.biome_warp * simplex2(nx / 256 + 83.1, nz / 256 + 12.9)
      const ci = Math.floor(qx / size)
      const cj = Math.floor(qz / size)
      let c1 = null
      let c2 = null
      let d1 = Infinity
      let d2 = Infinity
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const cell = cellAt(ci + di, cj + dj)
          const d = Math.hypot(qx - cell.fx, qz - cell.fz)
          if (d < d1) {
            c2 = c1
            d2 = d1
            c1 = cell
            d1 = d
          } else if (d < d2) {
            c2 = cell
            d2 = d
          }
        }
      }
      const w = params.biome_blend > 0 ? 0.5 + 0.5 * smoothstep(0, params.biome_blend, d2 - d1) : 1
      const temp = w * c1.temp + (1 - w) * c2.temp
      const rain = w * c1.rain + (1 - w) * c2.rain
      const terraceW = w * c1.terrace + (1 - w) * c2.terrace
      uvs[j] = temp
      uvs[j + 1] = rain

      let h =
        simplex2((x0 + x) / 8, (z0 + y) / 8) * (rain + 0.3) +
        simplex2((x0 + x) / 128, (z0 + y) / 128) * 4 +
        Math.min(32, simplex2((x0 + x) / 768, (z0 + y) / 768) * 32 + 16)

      const m = Math.abs(perlin2((x0 + x) / params.mountain_divisor, (z0 + y) / params.mountain_divisor))
      const mt = Math.abs(simplex2((x0 + x) / params.mountain_divisor, (z0 + y) / params.mountain_divisor) * 0.2)
      if (m < mt && h > params.mountain_threshold) {
        h *= 1 + ((mt - m) * h) / 5
      }

      if (terraceW > 0 && h > 0) h += (terrace(h, params.terrace_step, params.terrace_ramp) - h) * terraceW

      heights[k] = Math.max(0, h)

      const r =
        Math.abs(simplex2((x0 + x) / 96, (z0 + y) / 96)) <
        Math.min(0.2, Math.abs((3 - h) / 8))

      if (h < 0) {
        uvs[j] = 1
        uvs[j + 1] = 1
      }
      if (r && heights[k] < 3) {
        heights[k] *= 0.2
        uvs[j] = 1
        uvs[j + 1] = 1
      }

      // Edge vertices are shared with the neighbour chunk, which decorates them
      if (x === cs - 1 || y === cs - 1) continue

      // Local vertex position, exactly as PlaneGeometry + rotateX(-PI / 2) stores it
      const lx = Math.fround(x * seg - half)
      const lz = Math.fround(y * seg - half)
      const wx = lx + cx * cs
      const wz = lz + cz * cs

      if (heights[k] > 3 && temp < 0.15 && perlin2(x0 + x, z0 + y) > 0.88) {
        const troty = perlin2((x0 + x) * params.troty_multiplier, (z0 + y) * params.troty_multiplier) * Math.PI * 2
        pushDecoration(lists.WELLS, wx, heights[k], wz, troty)
      }

      if (heights[k] > 3 && heights[k] < 30 && temp < 0.6 && temp > 0.2 && perlin2(x0 + x, z0 + y) > 0.95) {
        const troty = perlin2((x0 + x) * params.troty_multiplier, (z0 + y) * params.troty_multiplier) * Math.PI * 2
        pushDecoration(lists.HOUSE, wx, heights[k] + 1, wz, troty)
      } else if (heights[k] > 5 && heights[k] < 40 && temp > 0.34 && rain < 0.67 && perlin2(x0 + x, z0 + y) > 0.7) {
        const treechoice = perlin2((x0 + x) * params.tree_choice_x_multiplier, (z0 + y) * params.tree_choice_z_multiplier)
        const troty = perlin2((x0 + x) * params.troty_multiplier, (z0 + y) * params.troty_multiplier) * Math.PI * 2
        if (treechoice < params.tree_a_threshold) {
          pushDecoration(lists.TREEA, wx, heights[k], wz, troty)
        } else if (treechoice > params.tree_b_threshold) {
          pushDecoration(lists.TREEB, wx, heights[k], wz, troty)
        } else {
          pushDecoration(lists.TREEC, wx, heights[k], wz, troty)
        }
      }
    }
  }

  const decorations = {}
  for (const key of Object.keys(lists)) decorations[key] = new Float32Array(lists[key])
  return { heights, uvs, decorations }
}
