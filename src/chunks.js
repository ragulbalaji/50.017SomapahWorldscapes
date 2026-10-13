import * as THREE from 'three'
import { PARAMETERS } from './config.js'
import { generateChunk } from './terrain/generate.js'
import { buildChunkGeometry } from './terrain/mesh.js'
import { worldToGrid, heightInGrid } from './terrain/ground.js'

// Chunk offsets within gen_depth of the player's chunk, nearest first.
const offsetsByDepth = new Map()
function offsetsWithin (depth) {
  let offsets = offsetsByDepth.get(depth)
  if (!offsets) {
    offsets = []
    for (let dx = -depth; dx <= depth; dx++) {
      for (let dz = -depth; dz <= depth; dz++) offsets.push([dx, dz])
    }
    offsets.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]))
    offsetsByDepth.set(depth, offsets)
  }
  return offsets
}

export class ChunkManager {
  constructor (scene, material, decorations) {
    this.scene = scene
    this.material = material
    this.decorations = decorations
    this.entries = new Map() // 'cx,cz' -> { cx, cz, mesh, heights, decorations }
    this.changed = false // chunks added or removed since the last decoration rebuild
  }

  get size () {
    return this.entries.size
  }

  update (position) {
    const cs = PARAMETERS.chunk_size
    const depth = PARAMETERS.gen_depth
    const pcx = Math.floor(position.x / cs + 0.5)
    const pcz = Math.floor(position.z / cs + 0.5)

    for (const [key, entry] of this.entries) {
      if (Math.max(Math.abs(entry.cx - pcx), Math.abs(entry.cz - pcz)) > depth + 1) this.unload(key)
    }

    for (const [dx, dz] of offsetsWithin(depth)) {
      const cx = pcx + dx
      const cz = pcz + dz
      const key = `${cx},${cz}`
      if (this.entries.has(key)) continue
      this.add(key, cx, cz, generateChunk({ ...PARAMETERS }, cx, cz))
      break // one chunk per frame
    }

    if (this.changed) {
      this.changed = false
      const nearest = [...this.entries.values()].sort((a, b) =>
        ((a.cx - pcx) ** 2 + (a.cz - pcz) ** 2) - ((b.cx - pcx) ** 2 + (b.cz - pcz) ** 2))
      this.decorations.rebuild(nearest)
    }
  }

  add (key, cx, cz, { heights, uvs, decorations }) {
    const cs = PARAMETERS.chunk_size
    const mesh = new THREE.Mesh(buildChunkGeometry(cs, heights, uvs), this.material)
    mesh.position.set(cx * cs, 0, cz * cs)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    this.entries.set(key, { cx, cz, mesh, heights, decorations })
    this.changed = true
  }

  unload (key) {
    const { mesh } = this.entries.get(key)
    mesh.geometry.dispose()
    this.scene.remove(mesh)
    this.entries.delete(key)
    this.changed = true
  }

  // Height of the rendered terrain at world (x, z); null if that chunk is not loaded.
  groundHeightAt (x, z) {
    const cs = PARAMETERS.chunk_size
    const gx = worldToGrid(x, cs)
    const gz = worldToGrid(z, cs)
    const entry = this.entries.get(`${gx.c},${gz.c}`)
    return entry ? heightInGrid(entry.heights, cs, gx.g, gz.g) : null
  }

  setMaterial (material) {
    this.material = material
    for (const { mesh } of this.entries.values()) mesh.material = material
  }

  reset () {
    for (const key of this.entries.keys()) this.unload(key)
  }
}
