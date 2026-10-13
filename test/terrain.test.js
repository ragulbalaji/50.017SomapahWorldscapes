import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateChunk } from '../src/terrain/generate.js'
import { seed, simplex2 } from '../src/terrain/noise.js'
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

test('seeds that differ only above the low 16 bits give different noise', () => {
  const sample = () => Array.from({ length: 10 }, (_, i) => simplex2(i + 0.5, i + 0.5))
  seed(256)
  const a = sample()
  seed(65792)
  const b = sample()
  assert.notDeepEqual(a, b)
})

// Seeds whose chunk pairs place a duplicate decoration on the shared edge
// unless edge vertices are skipped (x seam: seed 1, z seam: seed 6).
for (const [s, cx, cz] of [[1, 1, 0], [6, 0, 1]]) {
  test(`chunks (0,0) and (${cx},${cz}) share no decoration position (seed ${s})`, () => {
    const p = params(s)
    const positions = c => Object.values(c.decorations).flatMap(m => {
      const out = []
      for (let o = 0; o < m.length; o += 16) out.push(`${m[o + 12]},${m[o + 14]}`)
      return out
    })
    const a = new Set(positions(generateChunk(p, 0, 0)))
    for (const pos of positions(generateChunk(p, cx, cz))) assert.ok(!a.has(pos), `duplicate decoration at ${pos}`)
  })
}
