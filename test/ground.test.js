import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { generateChunk } from '../src/terrain/generate.js'
import { worldToGrid, heightInGrid } from '../src/terrain/ground.js'
import { buildChunkGeometry } from '../src/terrain/mesh.js'
import { PARAMETERS } from '../src/config.js'

test('heightInGrid matches the rendered chunk surface', () => {
  const cs = 16
  const { heights, uvs } = generateChunk({ ...PARAMETERS, chunk_size: cs, world_seed: 7 }, 2, -1)
  const mesh = new THREE.Mesh(buildChunkGeometry(cs, heights, uvs), new THREE.MeshBasicMaterial())
  mesh.position.set(32, 0, -16)
  mesh.updateMatrixWorld()

  const raycaster = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)
  for (let k = 0; k < 50; k++) {
    const gx = ((k * 0.618034) % 1) * 15
    const gz = ((k * 0.414214) % 1) * 15
    const x = 24 + gx * 16 / 15
    const z = -24 + gz * 16 / 15
    const px = worldToGrid(x, cs)
    const pz = worldToGrid(z, cs)
    assert.equal(px.c, 2)
    assert.equal(pz.c, -1)

    raycaster.set(new THREE.Vector3(x, 1000, z), down)
    const [hit] = raycaster.intersectObject(mesh)
    assert.ok(hit, `no hit at (${x}, ${z})`)
    const expected = heightInGrid(heights, cs, px.g, pz.g)
    assert.ok(Math.abs(hit.point.y - expected) < 1e-3, `k=${k}: ray ${hit.point.y} vs grid ${expected}`)
  }
})
