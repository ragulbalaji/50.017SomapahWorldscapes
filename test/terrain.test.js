import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateChunk } from '../src/terrain/generate.js'
import { PARAMETERS } from '../src/config.js'

const params = s => ({ ...PARAMETERS, world_seed: s })

test('generateChunk is deterministic', () => {
  const a = generateChunk(params(1), 3, -2)
  const b = generateChunk(params(1), 3, -2)
  assert.deepEqual(a, b)
})

for (const s of [1, 2]) {
  test(`neighbouring chunks share their edge vertices (seed ${s})`, () => {
    const p = params(s)
    const cs = p.chunk_size
    const c00 = generateChunk(p, 0, 0)
    const c10 = generateChunk(p, 1, 0)
    const c01 = generateChunk(p, 0, 1)
    for (let i = 0; i < cs; i++) {
      // chunk (0,0) last column vs chunk (1,0) first column
      const a = i * cs + cs - 1
      const b = i * cs
      assert.equal(c00.heights[a], c10.heights[b], `x seam height, row ${i}`)
      assert.equal(c00.uvs[2 * a], c10.uvs[2 * b], `x seam u, row ${i}`)
      assert.equal(c00.uvs[2 * a + 1], c10.uvs[2 * b + 1], `x seam v, row ${i}`)
      // chunk (0,0) last row vs chunk (0,1) first row
      const c = (cs - 1) * cs + i
      const d = i
      assert.equal(c00.heights[c], c01.heights[d], `z seam height, column ${i}`)
      assert.equal(c00.uvs[2 * c], c01.uvs[2 * d], `z seam u, column ${i}`)
      assert.equal(c00.uvs[2 * c + 1], c01.uvs[2 * d + 1], `z seam v, column ${i}`)
    }
  })
}

test('different seeds give different heights', () => {
  const a = generateChunk(params(1), 0, 0)
  const b = generateChunk(params(2), 0, 0)
  assert.notDeepEqual(a.heights, b.heights)
})
