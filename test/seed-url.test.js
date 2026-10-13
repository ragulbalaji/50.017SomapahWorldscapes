import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSeed } from '../src/seed-url.js'

test('parseSeed accepts valid seeds', () => {
  assert.equal(parseSeed('#seed=42'), 42)
  assert.equal(parseSeed('#seed=42&x=1'), 42)
  assert.equal(parseSeed('#seed=4294967295'), 4294967295)
})

test('parseSeed rejects invalid seeds', () => {
  assert.equal(parseSeed('#seed=4294967296'), null)
  assert.equal(parseSeed('#seed=-1'), null)
  assert.equal(parseSeed('#seed=abc'), null)
  assert.equal(parseSeed(''), null)
})
