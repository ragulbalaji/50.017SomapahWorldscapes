/* eslint-env worker */
import { generateChunk } from './generate.js'
self.onmessage = ({ data }) => {
  const { epoch, key, cx, cz, params } = data
  const chunk = generateChunk(params, cx, cz)
  const transfer = [chunk.heights.buffer, chunk.uvs.buffer, ...Object.values(chunk.decorations).map(a => a.buffer)]
  self.postMessage({ epoch, key, cx, cz, ...chunk }, transfer)
}
