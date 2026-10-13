export function parseSeed (hash) {
  const v = new URLSearchParams(hash.replace(/^#/, '')).get('seed')
  if (v === null || !/^\d{1,10}$/.test(v)) return null
  const n = Number(v)
  return n <= 0xffffffff ? n : null
}

export function writeSeed (seed) { window.history.replaceState(null, '', '#seed=' + seed) }

export function randomSeed () { return Math.floor(Math.random() * 2 ** 32) }
