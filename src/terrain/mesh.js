import * as THREE from 'three'

// Chunk geometry: cs x cs vertices spanning cs units, lying in the xz plane.
export function buildChunkGeometry (cs, heights, uvs) {
  const geometry = new THREE.PlaneGeometry(cs, cs, cs - 1, cs - 1)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position.array
  for (let k = 0; k < heights.length; k++) position[3 * k + 1] = heights[k]
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.computeBoundingSphere()
  return geometry
}
