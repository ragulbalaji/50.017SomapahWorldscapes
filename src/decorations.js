import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MODELS } from './config.js'

// Loads every model in MODELS as instanced meshes. All sub-meshes of a model
// share one instance matrix buffer, refilled by rebuild().
export async function loadDecorations (scene) {
  const loader = new GLTFLoader()
  const keys = Object.keys(MODELS)
  const gltfs = await Promise.all(keys.map(key => loader.loadAsync(MODELS[key].url)))

  const models = keys.map((key, i) => {
    const { capacity } = MODELS[key]
    const shared = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 16), 16)
    shared.setUsage(THREE.DynamicDrawUsage)

    const sources = []
    gltfs[i].scene.traverse(child => { if (child.isMesh) sources.push(child) })
    if (key === 'HOUSE') {
      const box = sources.find(child => child.name === 'Box')
      if (!box) throw new Error('house.gltf.glb: mesh "Box" not found')
      box.geometry.translate(0, -0.5, 0) // sink the base slab into the ground
    }

    const meshes = sources.map(child => {
      child.material.flatShading = true
      const mesh = new THREE.InstancedMesh(child.geometry, child.material, capacity)
      mesh.instanceMatrix = shared
      mesh.count = 0
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
      return mesh
    })

    return { key, capacity, shared, meshes }
  })

  return {
    // entries: loaded chunks sorted nearest-first, so far chunks lose their
    // decorations first when a model runs out of capacity.
    rebuild (entries) {
      for (const { key, capacity, shared, meshes } of models) {
        let total = 0
        for (const entry of entries) {
          const matrices = entry.decorations[key]
          const n = Math.min(matrices.length / 16, capacity - total)
          shared.array.set(n * 16 < matrices.length ? matrices.subarray(0, n * 16) : matrices, total * 16)
          total += n
          if (total === capacity) break
        }
        shared.needsUpdate = true
        for (const mesh of meshes) {
          mesh.count = total
          mesh.computeBoundingSphere()
        }
      }
    }
  }
}
